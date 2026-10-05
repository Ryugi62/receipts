// E1 — Symmetric FEVER v0.2 (Schuster et al., EMNLP 2019): verdicts with real evidence, and what happens when the evidence is
// swapped for an unrelated sentence (the evidence of the pair half a set away). Scores are stored per item so every variant
// below is computed from the same model outputs: shipped settings (web/config.json), gate off, plain 0.6 thresholds, and the
// "plain checker" (top sentence + raw label).
// Usage: npx tsx scripts/eval-symmetric.ts --split test [--model Xenova/nli-deberta-v3-xsmall] [--dtype q8]
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { TransformersNli, TransformersRanker, NLI_MODEL } from '../src/adapters/transformers'
import { passesRelevanceGate, aboutSubject } from '../src/domain/gate'
import { decideVerdict, naiveVerdict, type ScoredEvidence, type Thresholds } from '../src/domain/verdict'
import type { GateConfig } from '../src/domain/gate'
import { arg, ci, readJsonl } from './lib'

const split = arg('split', 'test')!
const modelId = arg('model', NLI_MODEL)!
const dtype = arg('dtype', 'q8')!
const shipped = JSON.parse(readFileSync('web/config.json', 'utf8')) as { gate: GateConfig; thresholds: Thresholds }
const rows = readJsonl(`data/symmetric/fever_symmetric_${split}.jsonl`) as { id: string; claim: string; evidence: string; label: 'SUPPORTS' | 'REFUTES' }[]
const nli = new TransformersNli(modelId, dtype)
const ranker = new TransformersRanker()
const t0 = Date.now()

// Topic for the subject rule = the Wikipedia page the FEVER evidence came from is not given, so we use the claim's leading
// capitalised words (the FEVER claim subject), the same heuristic the app uses for its topic guess.
const subjectOf = (claim: string) => claim.match(/^((?:[A-Z][\w'’.-]*\s?)+)/)?.[1]?.trim() ?? null

type Item = { id: string; label: string; claim: string; topic: string | null; real: { s: string; sim: number; en: number; co: number }; swap: { s: string; sim: number; en: number; co: number } }
const items: Item[] = []
const half = Math.floor(rows.length / 2)
for (let i = 0; i < rows.length; i += 16) {
  const batch = rows.slice(i, i + 16)
  const pairs = batch.flatMap((r, j) => [
    { premise: r.evidence, hypothesis: r.claim },
    { premise: rows[(i + j + half) % rows.length].evidence, hypothesis: r.claim },
  ])
  const inf = await nli.infer(pairs)
  for (const [j, r] of batch.entries()) {
    const other = rows[(i + j + half) % rows.length].evidence
    const [simReal, simSwap] = await ranker.similarities(r.claim, [r.evidence, other])
    const a = inf[2 * j], b = inf[2 * j + 1]
    items.push({
      id: r.id, label: r.label, claim: r.claim, topic: subjectOf(r.claim),
      real: { s: r.evidence, sim: +simReal.toFixed(4), en: +a.entail.toFixed(4), co: +a.contradict.toFixed(4) },
      swap: { s: other, sim: +simSwap.toFixed(4), en: +b.entail.toFixed(4), co: +b.contradict.toFixed(4) },
    })
  }
}
const ev = (it: Item, e: Item['real'], gate: GateConfig | null): ScoredEvidence => ({
  sentence: e.s, page: 'FEVER', url: '', similarity: e.sim,
  passesGate: gate ? passesRelevanceGate(it.claim, e.s, e.sim, gate, it.topic) : true,
  mentionsSubject: gate ? aboutSubject(e.s, it.topic, null) || e.s.includes(it.topic ?? '\u0000') : true,
  inference: { entail: e.en, contradict: e.co, neutral: Math.max(0, 1 - e.en - e.co) },
})
type Variant = { name: string; verdict: (it: Item, e: Item['real']) => string }
const plainT: Thresholds = { entail: 0.6, contradict: 0.6 }
const variants: Variant[] = [
  { name: 'Receipts as shipped (gate + web/config.json thresholds)', verdict: (it, e) => decideVerdict([ev(it, e, shipped.gate)], shipped.thresholds).label },
  { name: 'shipped thresholds, gate OFF', verdict: (it, e) => decideVerdict([ev(it, e, null)], { ...shipped.thresholds, contradictNeedsSubject: false, entailNeedsSubject: false }).label },
  { name: 'gate ON, plain 0.6/0.6 thresholds', verdict: (it, e) => decideVerdict([ev(it, e, shipped.gate)], plainT).label },
  { name: 'plain checker: raw NLI label, no gate', verdict: (it, e) => naiveVerdict([ev(it, e, null)]).label },
]
const n = items.length
const lines: string[] = [`# E1 Symmetric FEVER v0.2 ${split} (${n} pairs) — model ${modelId} (${dtype})`, '',
  '| Setting | Real evidence: correct | Coverage (not "no receipt") | Correct when decided | SUPPORTS → backed | REFUTES → conflict | Unrelated sentence → "no receipt" | Unrelated → "conflict" |',
  '|---|---|---|---|---|---|---|---|']
for (const v of variants) {
  let ok = 0, dec = 0, sup = 0, supOk = 0, ref = 0, refOk = 0, swNo = 0, swCo = 0
  for (const it of items) {
    const want = it.label === 'SUPPORTS' ? 'backed' : 'contradicted'
    const r = v.verdict(it, it.real), s = v.verdict(it, it.swap)
    if (r === want) ok++
    if (r !== 'no_receipt') dec++
    if (it.label === 'SUPPORTS') { sup++; if (r === 'backed') supOk++ } else { ref++; if (r === 'contradicted') refOk++ }
    if (s === 'no_receipt') swNo++
    if (s === 'contradicted') swCo++
  }
  lines.push(`| ${v.name} | ${ci(ok, n)} | ${ci(dec, n)} | ${ci(ok, dec)} | ${ci(supOk, sup)} | ${ci(refOk, ref)} | ${ci(swNo, n)} | ${ci(swCo, n)} |`)
}
const NEG = /\b(not|never|no|none|nobody|nothing|neither|nor|only|refused|failed|incapable|unable|didn't|isn't|wasn't|won't)\b/i
const cue = items.filter((it) => (NEG.test(it.claim) ? 'REFUTES' : 'SUPPORTS') === it.label).length
lines.push('', `- Claim-only cue baseline (negation word → refutes): ${ci(cue, n)} — the symmetric set is built so the claim alone carries no signal (a property of the data set, not of our model).`)
lines.push(`- "Unrelated" = the evidence sentence of the pair ${half} rows away (a different subject). This is the easy case; hard, same-topic cases are measured in E2 on real labels (false conflicts on human-supported facts).`)
lines.push(`- Runtime: ${((Date.now() - t0) / 1000).toFixed(0)} s (batched inference, laptop CPU).`)
const report = lines.join('\n')
console.log(report)
mkdirSync('docs/results', { recursive: true })
const tag = `${split}-${modelId.split('/')[1]}-${dtype}`
writeFileSync(`docs/results/e1-${tag}.md`, report + '\n')
writeFileSync(`docs/results/e1-${tag}.jsonl`, items.map((x) => JSON.stringify(x)).join('\n') + '\n')
