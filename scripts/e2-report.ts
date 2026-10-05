// E2 report on held-out topics with the settings frozen on dev (docs/results/chosen-fact-<model>.json):
// baselines, gate ablation, topic-level bootstrap intervals, false conflicts on human-supported facts, FActScore-style estimate,
// and the same numbers without the topics we had looked at while building (demo samples).
// Usage: npx tsx scripts/e2-report.ts --model nli-deberta-v3-xsmall --split test [--data ChatGPT] [--level fact]
import { readFileSync, writeFileSync } from 'node:fs'
import { passesRelevanceGate, aboutSubject, type GateConfig } from '../src/domain/gate'
import { decideVerdict, aggregateVerdicts, naiveVerdict, type ScoredEvidence, type Thresholds, type Verdict } from '../src/domain/verdict'
import { arg, pct, readJsonl } from './lib'

const model = arg('model', 'nli-deberta-v3-xsmall')!
const split = arg('split', 'test')!
const level = arg('level', 'fact')!
const data = arg('data', 'ChatGPT')!
const tag = arg('tag', '')
const file = `docs/results/e2-${level}-${split}-${model}${data === 'ChatGPT' ? '' : '-' + data}${tag ? '-' + tag : ''}.jsonl`
const chosenPath = arg('chosen', `docs/results/chosen-fact-${model}.json`)!
const chosen = JSON.parse(readFileSync(chosenPath, 'utf8')) as { gate: GateConfig; thresholds: Thresholds }
const outSuffix = arg('out', '')
type Ev = { s: string; page: string; sim: number; en: number; co: number }
type Rec = { key: string; topic: string | null; claim: string; label: 'S' | 'NS'; ev?: Ev[]; parts?: { text: string; ev: Ev[] }[] }
const recs = readJsonl(file) as Rec[]
// Topics used as UI samples / looked at during development (disclosed in docs/eval.md).
const SEEN = new Set(['Julia Faye', 'Carlos Santana', 'Marianne McAndrew'])

const toEv = (claim: string, topic: string | null, e: Ev, gate: GateConfig | null): ScoredEvidence => ({
  sentence: e.s, page: e.page, url: '', similarity: e.sim,
  passesGate: gate ? passesRelevanceGate(claim, e.s, e.sim, gate, topic) : true,
  mentionsSubject: gate ? aboutSubject(e.s, topic, e.page) : true,
  inference: { entail: e.en, contradict: e.co, neutral: Math.max(0, 1 - e.en - e.co) },
})
type System = { name: string; part: (claim: string, topic: string | null, ev: Ev[]) => Verdict }
const off = { ...chosen.thresholds, contradictNeedsSubject: false, entailNeedsSubject: false }
const systems: System[] = [
  { name: `Receipts (${chosenPath.includes('v2') ? 'v2' : 'v1'} settings, frozen on dev)`, part: (c, t, ev) => decideVerdict(ev.map((e) => toEv(c, t, e, chosen.gate)), chosen.thresholds) },
  { name: 'same thresholds, gate OFF', part: (c, t, ev) => decideVerdict(ev.map((e) => toEv(c, t, e, null)), off) },
  { name: 'plain checker (top sentence + raw NLI label)', part: (c, t, ev) => naiveVerdict(ev.map((e) => toEv(c, t, e, null))) },
  { name: 'flag everything', part: () => ({ label: 'no_receipt', receipts: [], disagreement: false, gated: 0 }) },
]
const verdictOf = (s: System, r: Rec): Verdict => (r.parts ? aggregateVerdicts(r.parts.map((p) => s.part(p.text, r.topic, p.ev))) : s.part(r.claim, r.topic, r.ev ?? []))

function stats(rs: Rec[], s: System) {
  let tp = 0, fn = 0, tn = 0, fp = 0, backed = 0, backedS = 0, contra = 0, contraNS = 0, falseConflict = 0, nS = 0, offSubject = 0
  const topics = new Map<string, { n: number; s: number; b: number }>()
  for (const r of rs) {
    const v = verdictOf(s, r).label
    const flag = v !== 'backed'
    if (r.label === 'NS') flag ? tp++ : fn++
    else { flag ? fp++ : tn++; nS++; if (v === 'contradicted') falseConflict++ }
    if (v === 'backed') { backed++; if (r.label === 'S') backedS++ }
    if (v === 'contradicted') {
      contra++
      if (r.label === 'NS') contraNS++
      const vr = verdictOf(s, r)
      if (vr.receipts.some((rc) => !aboutSubject(rc.sentence, r.topic, rc.page))) offSubject++
    }
    const k = r.key.split('|')[0]
    const o = topics.get(k) ?? { n: 0, s: 0, b: 0 }
    o.n++; o.s += r.label === 'S' ? 1 : 0; o.b += v === 'backed' ? 1 : 0
    topics.set(k, o)
  }
  const tv = [...topics.values()]
  return {
    n: rs.length, topics: tv.length, bal: (tp / Math.max(1, tp + fn) + tn / Math.max(1, tn + fp)) / 2,
    backedPrec: backed ? backedS / backed : NaN, backed, contraPrec: contra ? contraNS / contra : NaN, contra,
    flagged: (tp + fp) / rs.length, nsRecall: tp / Math.max(1, tp + fn), base: (tp + fn) / rs.length,
    falseConflict: nS ? falseConflict / nS : NaN, offSubject,
    human: tv.reduce((a, o) => a + o.s / o.n, 0) / tv.length, est: tv.reduce((a, o) => a + o.b / o.n, 0) / tv.length,
  }
}
// Bootstrap over topics (facts inside one biography are correlated): 1,000 resamples, seeded.
function bootstrap(rs: Rec[], s: System, key: 'bal' | 'backedPrec' | 'contraPrec' | 'falseConflict'): [number, number] {
  const by = new Map<string, Rec[]>()
  for (const r of rs) { const k = r.key.split('|')[0]; by.set(k, [...(by.get(k) ?? []), r]) }
  const groups = [...by.values()]
  let seed = 7
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)
  const vals: number[] = []
  for (let b = 0; b < 1000; b++) {
    const sample = Array.from({ length: groups.length }, () => groups[Math.floor(rnd() * groups.length)]).flat()
    const v = stats(sample, s)[key]
    if (!Number.isNaN(v)) vals.push(v)
  }
  vals.sort((a, b) => a - b)
  return [vals[Math.floor(0.025 * vals.length)], vals[Math.floor(0.975 * vals.length)]]
}
const f = (x: number) => (Number.isNaN(x) ? '—' : pct(x))
const fci = (x: number, c: [number, number]) => `${f(x)} [${f(c[0])}–${f(c[1])}]`
function table(rs: Rec[], title: string) {
  const out = [`### ${title} — ${rs.length} ${level === "sentence" ? "sentences" : "facts"}, ${new Set(rs.map((r) => r.key.split('|')[0])).size} topics, ${f(rs.filter((r) => r.label === 'NS').length / rs.length)} of facts not supported by humans`, '',
    '| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |',
    '|---|---|---|---|---|---|---|---|']
  for (const s of systems) {
    const m = stats(rs, s)
    const isFlagAll = s.name === 'flag everything'
    out.push(`| ${s.name} | ${isFlagAll ? f(m.bal) : fci(m.bal, bootstrap(rs, s, 'bal'))} | ${m.backed ? `${fci(m.backedPrec, bootstrap(rs, s, 'backedPrec'))} (n=${m.backed})` : '—'} | ${m.contra ? `${fci(m.contraPrec, bootstrap(rs, s, 'contraPrec'))} (n=${m.contra})` : '—'} | ${isFlagAll ? '0.0%' : fci(m.falseConflict, bootstrap(rs, s, 'falseConflict'))} | ${m.offSubject} | ${f(m.flagged)} | ${f(m.est)} (${f(m.human)}) |`)
  }
  return out.join('\n')
}
// Stress test (designed on dev): keep only evidence from pages that are NOT the subject's own article — as if the person had
// no Wikipedia page, which is common for the less famous things students ask about. Ideal behaviour: few verdicts.
const otherPagesOnly = (rs: Rec[]): Rec[] => rs.map((r) => ({ ...r, ev: r.ev?.filter((e) => !aboutSubject(e.page, r.topic, null)), parts: r.parts?.map((p) => ({ ...p, ev: p.ev.filter((e) => !aboutSubject(e.page, r.topic, null)) })) }))
// Calibration: bin facts by the highest entail score among gated sentences; share of human-supported facts per bin.
function calibration(rs: Rec[]) {
  const bins = [0, 0.2, 0.4, 0.6, 0.8, 0.9, 1.0001]
  const rows = bins.slice(0, -1).map((lo, i) => ({ lo, hi: bins[i + 1], n: 0, s: 0 }))
  for (const r of rs) {
    if (r.parts) continue
    const ev = (r.ev ?? []).map((e) => toEv(r.claim, r.topic, e, chosen.gate)).filter((e) => e.passesGate)
    const top = ev.length ? Math.max(...ev.map((e) => e.inference.entail)) : 0
    const b = rows.find((x) => top >= x.lo && top < x.hi)!
    b.n++; b.s += r.label === 'S' ? 1 : 0
  }
  return ['| Highest "backs" score among gated sentences | Facts | Humans: supported |', '|---|---|---|',
    ...rows.map((x) => `| ${x.lo.toFixed(1)}–${Math.min(1, x.hi).toFixed(1)} | ${x.n} | ${x.n ? pct(x.s / x.n) : '—'} |`)].join('\n')
}
const report = [
  `# E2 ${data} biographies, ${level} level, ${split.toUpperCase()} topics — model ${model}`,
  `Settings frozen on dev: gate ${JSON.stringify(chosen.gate)}, thresholds ${JSON.stringify(chosen.thresholds)}. Intervals: 95 % bootstrap over topics (1,000 resamples).`,
  '', table(recs, `All ${split} topics`), '',
  table(recs.filter((r) => !SEEN.has(r.key.split('|')[0])), `Without the topics used as UI samples during development (${[...SEEN].join(', ')})`),
  '', table(otherPagesOnly(recs), "Stress test — evidence only from other pages (as if the subject had no article of their own)"),
  ...(level === 'fact' ? ['', '### Calibration (is a higher "backs" score more often right?)', '', calibration(recs)] : []),
].join('\n')
console.log(report)
writeFileSync(file.replace('.jsonl', `${outSuffix}.report.md`), report + '\n')
