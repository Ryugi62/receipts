// Build web/numbers.json (the "How do we know" list on the page) from the committed result files, so the page
// never shows a number that is not in docs/results. Usage: npx tsx scripts/numbers.ts
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const read = (p: string) => (existsSync(p) ? readFileSync(p, 'utf8') : '')
const grab = (text: string, re: RegExp) => text.match(re)?.[1] ?? null

const naive = read('docs/results/e1-test-nli-deberta-v3-xsmall-q8.md')
const e2 = read('docs/results/e2-fact-nli-deberta-v3-xsmall-test.md')
const lines: string[] = []
const rawContra = grab(naive, /raw model says "contradicted": (\d+\/\d+ = [\d.]+%)/)
const gated = grab(naive, /no_receipt WITH relevance gate: (\d+\/\d+ = [\d.]+%)/)
if (rawContra && gated)
  lines.push(`Given an <b>unrelated</b> sentence, the small model on its own says "contradiction" <b>${rawContra}</b> of the time. With Receipts' relevance gate the answer is "no receipt" <b>${gated}</b> (712 pairs, Symmetric FEVER test set, Schuster et al. 2019).`)
const testPart = e2.split('## TEST')[1] ?? ''
const backed = grab(testPart, /says \*\*Backed\*\*, humans agree: (\d+\/\d+ = [\d.]+%)/)
const caught = grab(testPart, /Human "not supported" caught: (\d+\/\d+ = [\d.]+%)/)
const n = grab(testPart, /— (\d+) claims/)
if (backed && caught)
  lines.push(`On <b>real ChatGPT answers</b> with human fact labels (FActScore, Min et al. 2023; ${n} facts on held-out topics, live Wikipedia): when Receipts says <b>Backed</b>, the human annotators agree <b>${backed}</b>; of the facts humans marked not supported, Receipts flags <b>${caught}</b> for checking.`)
lines.push('Settings (relevance bar, thresholds) were chosen on separate development topics and then frozen before the held-out run.')
writeFileSync('web/numbers.json', JSON.stringify({ lines }, null, 1) + '\n')
console.log(lines.join('\n'))
