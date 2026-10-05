// Component ablation of revision 2 on the fresh held-out set (and ChatGPT test, seen), with paired topic-bootstrap differences
// against the plain checker. Usage: npx tsx scripts/ablation.ts
import { readFileSync, writeFileSync } from 'node:fs'
import { passesRelevanceGate, aboutSubject, type GateConfig } from '../src/domain/gate'
import { decideVerdict, naiveVerdict, type Thresholds, type Verdict } from '../src/domain/verdict'
import { pct, readJsonl } from './lib'

type Ev = { s: string; page: string; sim: number; en: number; co: number }
type Rec = { key: string; topic: string | null; claim: string; label: 'S' | 'NS'; ev: Ev[] }
const v2 = JSON.parse(readFileSync('docs/results/chosen-v2.json', 'utf8')) as { gate: GateConfig; thresholds: Thresholds }
const OFF: GateConfig = { minSimilarity: -2, minSharedTokens: 0, ignoreTopicTokens: false }
const toEv = (r: Rec, e: Ev, gate: GateConfig) => ({
  sentence: e.s, page: e.page, url: '', similarity: e.sim, passesGate: passesRelevanceGate(r.claim, e.s, e.sim, gate, r.topic),
  mentionsSubject: aboutSubject(e.s, r.topic, e.page), inference: { entail: e.en, contradict: e.co, neutral: Math.max(0, 1 - e.en - e.co) },
})
type Sys = [string, (r: Rec) => Verdict]
const R = (gate: GateConfig, t: Thresholds) => (r: Rec) => decideVerdict(r.ev.map((e) => toEv(r, e, gate)), t)
const systems: Sys[] = [
  ['Receipts v2 (all components)', R(v2.gate, v2.thresholds)],
  ['− similarity gate', R(OFF, v2.thresholds)],
  ['− subject rule', R(v2.gate, { ...v2.thresholds, contradictNeedsSubject: false })],
  ['− conflict only from the top sentence', R(v2.gate, { ...v2.thresholds, conflictFromTopOnly: false })],
  ['− strict thresholds (0.6 / 0.6)', R(v2.gate, { ...v2.thresholds, entail: 0.6, contradict: 0.6 })],
  ['plain checker', (r) => naiveVerdict(r.ev.map((e) => toEv(r, e, OFF)))],
]
type Pre = { topic: string; label: 'S' | 'NS'; v: string[] }
function score(rs: Pre[], i: number) {
  let tp = 0, fn = 0, tn = 0, fp = 0, fc = 0, nS = 0, cTrue = 0, nNS = 0
  for (const r of rs) {
    const v = r.v[i]
    const flag = v !== 'backed'
    if (r.label === 'NS') { nNS++; flag ? tp++ : fn++; if (v === 'contradicted') cTrue++ }
    else { nS++; flag ? fp++ : tn++; if (v === 'contradicted') fc++ }
  }
  return { bal: (tp / Math.max(1, tp + fn) + tn / Math.max(1, tn + fp)) / 2, fc: fc / Math.max(1, nS), conflictRecall: cTrue / Math.max(1, nNS) }
}
function report(file: string, title: string) {
  // Verdicts do not depend on the resample, so compute them once per fact and system.
  const rs: Pre[] = (readJsonl(file) as Rec[]).map((r) => ({ topic: r.key.split('|')[0], label: r.label, v: systems.map(([, f]) => f(r).label) }))
  const by = new Map<string, Pre[]>()
  for (const r of rs) by.set(r.topic, [...(by.get(r.topic) ?? []), r])
  const groups = [...by.values()]
  let seed = 11
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)
  const samples = Array.from({ length: 1000 }, () => Array.from({ length: groups.length }, () => groups[Math.floor(rnd() * groups.length)]).flat())
  const P = systems.length - 1
  const lines = [`### ${title} — ${rs.length} facts, ${groups.length} topics`, '',
    '| System | Balanced accuracy | Δ vs plain checker (paired 95 % CI) | False conflicts on human-supported facts | Unsupported facts caught as "May conflict" |', '|---|---|---|---|---|']
  systems.forEach(([name], i) => {
    const m = score(rs, i)
    let ci = '—'
    if (i !== P) {
      const d = samples.map((s) => score(s, i).bal - score(s, P).bal).sort((a, b) => a - b)
      ci = `${(100 * (m.bal - score(rs, P).bal)).toFixed(1)} pts [${(100 * d[25]).toFixed(1)}, ${(100 * d[974]).toFixed(1)}]`
    }
    lines.push(`| ${name} | ${pct(m.bal)} | ${ci} | ${pct(m.fc)} | ${pct(m.conflictRecall)} |`)
  })
  return lines.join('\n')
}
const out = ['# Revision 2 — component ablation', '',
  report('docs/results/e2-fact-test-nli-deberta-v3-xsmall-PerplexityAI-v2.jsonl', 'Fresh held-out: PerplexityAI test topics'), '',
  report('docs/results/e2-fact-test-nli-deberta-v3-xsmall.jsonl', 'ChatGPT test topics (seen in v1)'),
  '', 'Reading: most of the gain on real answers comes from the asymmetric decision rule (support may come from any of the top five sentences, a conflict only from the single most relevant one, above 0.97). The similarity gate matters mainly when the evidence is about something else (E1, stress test). The price: few real errors are caught as "May conflict".'].join('\n')
console.log(out)
writeFileSync('docs/results/ablation-v2.md', out + '\n')
