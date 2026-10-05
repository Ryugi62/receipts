// Choose the relevance gate + thresholds on DEV topics only, then apply the frozen choice to TEST topics.
// Usage: npx tsx scripts/sweep.ts --model nli-deberta-v3-xsmall [--level fact] [--apply test]
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { passesRelevanceGate, aboutSubject, type GateConfig } from '../src/domain/gate'
import { decideVerdict, aggregateVerdicts, type Thresholds } from '../src/domain/verdict'
import { arg, ci, pct, readJsonl } from './lib'

const model = arg('model', 'nli-deberta-v3-xsmall')!
const level = arg('level', 'fact')!
const apply = arg('apply')
type Ev = { s: string; page: string; sim: number; en: number; co: number }
type Rec = { key: string; topic: string | null; claim: string; label: 'S' | 'NS'; ev?: Ev[]; parts?: { text: string; ev: Ev[] }[] }
const load = (split: string) => readJsonl(`docs/results/e2-${level}-${split}-${model}.jsonl`) as Rec[]

function partVerdict(claim: string, topic: string | null, evs: Ev[], gate: GateConfig, t: Thresholds) {
  const ev = evs.map((e) => ({
    sentence: e.s, page: e.page, url: '', similarity: e.sim,
    passesGate: passesRelevanceGate(claim, e.s, e.sim, gate, topic),
    mentionsSubject: aboutSubject(e.s, topic, e.page),
    inference: { entail: e.en, contradict: e.co, neutral: Math.max(0, 1 - e.en - e.co) },
  }))
  return decideVerdict(ev, t)
}

export function verdictOf(r: Rec, gate: GateConfig, t: Thresholds) {
  if (r.parts) return aggregateVerdicts(r.parts.map((p) => partVerdict(p.text, r.topic, p.ev, gate, t)))
  return partVerdict(r.claim, r.topic, r.ev ?? [], gate, t)
}

export function metrics(recs: Rec[], gate: GateConfig, t: Thresholds) {
  let tp = 0, fn = 0, tn = 0, fp = 0, backed = 0, backedS = 0, contra = 0, contraNS = 0
  const byTopic = new Map<string, { n: number; s: number; b: number }>()
  for (const r of recs) {
    const v = verdictOf(r, gate, t)
    const predNS = v.label !== 'backed'
    if (r.label === 'NS') predNS ? tp++ : fn++
    else predNS ? fp++ : tn++
    if (v.label === 'backed') { backed++; if (r.label === 'S') backedS++ }
    if (v.label === 'contradicted') { contra++; if (r.label === 'NS') contraNS++ }
    const k = r.key.split('|')[0]
    const o = byTopic.get(k) ?? { n: 0, s: 0, b: 0 }
    o.n++; o.s += r.label === 'S' ? 1 : 0; o.b += v.label === 'backed' ? 1 : 0
    byTopic.set(k, o)
  }
  const tpr = tp / Math.max(1, tp + fn), tnr = tn / Math.max(1, tn + fp)
  const topics = [...byTopic.values()]
  const human = topics.reduce((a, o) => a + o.s / o.n, 0) / topics.length
  const est = topics.reduce((a, o) => a + o.b / o.n, 0) / topics.length
  const mae = topics.reduce((a, o) => a + Math.abs(o.s / o.n - o.b / o.n), 0) / topics.length
  return { n: recs.length, tp, fn, tn, fp, bal: (tpr + tnr) / 2, tpr, tnr, backed, backedS, contra, contraNS, human, est, mae, topics: topics.length }
}

const grid: { gate: GateConfig; t: Thresholds }[] = []
for (const minSimilarity of [0.2, 0.3, 0.4, 0.5])
  for (const minSharedTokens of [0, 1, 2])
    for (const ignoreTopicTokens of [false, true])
      for (const entail of [0.5, 0.6, 0.7, 0.8, 0.9])
        for (const contradict of [0.5, 0.7, 0.9, 0.97])
          for (const contradictNeedsSubject of [false, true])
            for (const entailNeedsSubject of [false, true])
              grid.push({ gate: { minSimilarity, minSharedTokens, ignoreTopicTokens }, t: { entail, contradict, contradictNeedsSubject, entailNeedsSubject } })

const dev = load('dev')
const scored = grid.map((g) => ({ ...g, m: metrics(dev, g.gate, g.t) })).sort((a, b) => b.m.bal - a.m.bal)
const best = scored[0]
const fmt = (name: string, m: ReturnType<typeof metrics>) => [
  `## ${name} — ${m.n} claims, ${m.topics} topics`,
  `- Balanced accuracy (human NS vs. our "needs checking" = contradicted or no receipt): ${pct(m.bal)}`,
  `- Human "not supported" caught: ${ci(m.tp, m.tp + m.fn)} · human "supported" marked backed: ${ci(m.tn, m.tn + m.fp)}`,
  `- When Receipts says **Backed**, humans agree: ${ci(m.backedS, m.backed)}`,
  `- When Receipts says **Contradicted**, humans also say not supported: ${ci(m.contraNS, m.contra)}`,
  `- Share of ChatGPT facts supported (FActScore-style, mean over topics): human ${pct(m.human)} · Receipts ${pct(m.est)} · mean |difference| per biography ${pct(m.mae)}`,
].join('\n')
let report = `# E2 FActScore ChatGPT biographies — ${level} level — model ${model}\n` +
  `Chosen on DEV (best balanced accuracy of ${grid.length} settings): gate ${JSON.stringify(best.gate)}, thresholds ${JSON.stringify(best.t)}\n\n` +
  fmt('DEV (used for choosing)', best.m)
const defaults = scored.find((s) => s.gate.minSimilarity === 0.3 && s.gate.minSharedTokens === 1 && !s.gate.ignoreTopicTokens && s.t.entail === 0.6 && s.t.contradict === 0.7)
if (defaults) report += `\n\n(For reference, a hand-picked default ${JSON.stringify(defaults.gate)} ${JSON.stringify(defaults.t)} on DEV: balanced ${pct(defaults.m.bal)})`
if (apply && existsSync(`docs/results/e2-${level}-${apply}-${model}.jsonl`)) {
  report += '\n\n' + fmt(`${apply.toUpperCase()} (held out — settings frozen from DEV)`, metrics(load(apply), best.gate, best.t))
}
console.log(report)
writeFileSync(`docs/results/e2-${level}-${model}${apply ? '-' + apply : ''}.md`, report + '\n')
writeFileSync(`docs/results/chosen-${level}-${model}.json`, JSON.stringify({ gate: best.gate, thresholds: best.t, devBalanced: best.m.bal }, null, 2))
