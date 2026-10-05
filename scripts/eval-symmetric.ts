// E1 — does the model read the evidence? Symmetric FEVER v0.2 (Schuster et al., EMNLP 2019).
// Usage: npx tsx scripts/eval-symmetric.ts --split test [--model Xenova/DeBERTa-v3-base-mnli-fever-anli] [--dtype q8]
import { writeFileSync, mkdirSync } from 'node:fs'
import { TransformersNli, TransformersRanker, NLI_MODEL } from '../src/adapters/transformers'
import { scoreEvidence, DEFAULT_OPTIONS } from '../src/application/checkAnswer'
import { decideVerdict } from '../src/domain/verdict'
import { arg, ci, readJsonl } from './lib'

const split = arg('split', 'test')!
const modelId = arg('model', NLI_MODEL)!
const dtype = arg('dtype', 'q8')!
const rows = readJsonl(`data/symmetric/fever_symmetric_${split}.jsonl`) as { id: string; claim: string; evidence: string; label: 'SUPPORTS' | 'REFUTES' }[]
const nli = new TransformersNli(modelId, dtype)
const ranker = new TransformersRanker()
const deps = { nli, ranker }
const opts = { ...DEFAULT_OPTIONS, topK: 1 }
const ungated = { ...opts, gate: { minSimilarity: -2, minSharedTokens: 0 } }

const NEG = /\b(not|never|no|none|nobody|nothing|neither|nor|only|refused|failed|incapable|unable|didn't|isn't|wasn't|won't)\b/i
let realOk = 0, realDecided = 0, swapNoReceipt = 0, swapNoReceiptRaw = 0, swapRawContradicted = 0, cueOk = 0
const per: any[] = []
const t0 = Date.now()
for (let i = 0; i < rows.length; i++) {
  const r = rows[i]
  const want = r.label === 'SUPPORTS' ? 'backed' : 'contradicted'
  const ev = { sentence: r.evidence, page: 'FEVER', url: '' }
  const real = decideVerdict(await scoreEvidence(r.claim, [ev], deps, opts), opts.thresholds)
  // Swap: evidence from a different row about a different subject (offset by half the set).
  const other = rows[(i + Math.floor(rows.length / 2)) % rows.length]
  const sw = { sentence: other.evidence, page: 'FEVER', url: '' }
  const swapScored = await scoreEvidence(r.claim, [sw], deps, opts)
  const swapGated = decideVerdict(swapScored, opts.thresholds)
  const swapRaw = decideVerdict(swapScored.map((e) => ({ ...e, passesGate: true })), ungated.thresholds)
  if (real.label === want) realOk++
  if (real.label !== 'no_receipt') realDecided++
  if (swapGated.label === 'no_receipt') swapNoReceipt++
  if (swapRaw.label === 'no_receipt') swapNoReceiptRaw++
  if (swapRaw.label === 'contradicted') swapRawContradicted++
  if ((NEG.test(r.claim) ? 'REFUTES' : 'SUPPORTS') === r.label) cueOk++
  per.push({ id: r.id, label: r.label, real: real.label, swapGated: swapGated.label, swapRaw: swapRaw.label })
  if (i % 100 === 0) process.stderr.write(`${i}/${rows.length}\n`)
}
const n = rows.length
const report = [
  `# E1 Symmetric FEVER v0.2 ${split} (${n} pairs) — model ${modelId} (${dtype}), thresholds entail ${opts.thresholds.entail} / contradict ${opts.thresholds.contradict}`,
  `- Real evidence, correct verdict: ${ci(realOk, n)} (decided ${ci(realDecided, n)}; undecided = no_receipt)`,
  `- Real evidence, accuracy when decided: ${ci(realOk, realDecided)}`,
  `- Swapped (unrelated) evidence -> no_receipt WITH relevance gate: ${ci(swapNoReceipt, n)}`,
  `- Swapped evidence -> no_receipt, raw model (no gate): ${ci(swapNoReceiptRaw, n)}; raw model says "contradicted": ${ci(swapRawContradicted, n)}`,
  `- Claim-only cue baseline (negation word => REFUTES): ${ci(cueOk, n)} — the symmetric set is built so the claim alone gives no signal`,
  `- Runtime: ${((Date.now() - t0) / 1000).toFixed(0)} s on this machine`,
].join('\n')
console.log(report)
mkdirSync('docs/results', { recursive: true })
const tag = `${split}-${modelId.split('/')[1]}-${dtype}`
writeFileSync(`docs/results/e1-${tag}.md`, report + '\n')
writeFileSync(`docs/results/e1-${tag}.jsonl`, per.map((x) => JSON.stringify(x)).join('\n') + '\n')
