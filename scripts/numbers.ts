// Build web/numbers.json and the README numbers block from committed result files (no number typed by hand).
// Usage: npx tsx scripts/numbers.ts
import { readFileSync, writeFileSync } from 'node:fs'

const row = (text: string, name: string) => text.split('\n').find((l) => l.startsWith(`| ${name}`))!.split('|').map((c) => c.trim())
const short = (cell: string) => cell.replace(/ \[.*?\]/, '').replace(/ \(n=\d+\)/, '')
const e1 = readFileSync('docs/results/e1-test-nli-deberta-v3-xsmall-q8.md', 'utf8')
const fresh = readFileSync('docs/results/e2-fact-test-nli-deberta-v3-xsmall-PerplexityAI-v2.report.md', 'utf8').split('### ')[1]
const facts = fresh.split('\n')[0].match(/— (\d+) facts/)![1]
const r = row(fresh, 'Receipts'), p = row(fresh, 'plain checker')
const u = (cells: string[]) => cells[8].match(/= ([\d.]+%)/)![1]
const lines = [
  `Given an <b>unrelated</b> sentence, the small model on its own calls it a contradiction <b>${u(row(e1, 'plain checker'))}</b> of the time; Receipts: <b>${u(row(e1, 'Receipts as shipped'))}</b> (712 pairs, Symmetric FEVER).`,
  `On a <b>fresh held-out set</b> of chatbot answers with human labels (FActScore, PerplexityAI biographies, ${Number(facts).toLocaleString('en')} facts), Receipts raises a false "may conflict" on true facts <b>${short(r[5])}</b> of the time, vs <b>${short(p[5])}</b> for a simpler top-sentence checker — mostly thanks to one rule: only the single most relevant sentence may raise a conflict.`,
  `Balanced accuracy ${short(r[2])} vs ${short(p[2])}; "Backed" is as precise as the simpler checker (${short(r[3])}) and covers more facts. Settings were frozen on separate development topics before this run.`,
  `The price: it rarely catches a mistake by itself. "No receipt" is common, and "May conflict" is a hint to read the sentence, not a verdict.`,
]
writeFileSync('web/numbers.json', JSON.stringify({ lines }, null, 1) + '\n')
const md = lines.map((l) => '- ' + l.replace(/<\/?b>/g, '**')).join('\n') + '\n- Full method, baselines, intervals and misses: [docs/eval.md](docs/eval.md)'
writeFileSync('README.md', readFileSync('README.md', 'utf8').replace(/<!-- NUMBERS -->[\s\S]*?<!-- \/NUMBERS -->/, `<!-- NUMBERS -->\n${md}\n<!-- /NUMBERS -->`))
console.log(lines.join('\n'))
