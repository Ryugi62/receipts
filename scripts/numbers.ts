// Build web/numbers.json (the "How do we know" list on the page) and the README numbers block from committed result files,
// so no number on the page or in the README is typed by hand. Usage: npx tsx scripts/numbers.ts
import { readFileSync, writeFileSync } from 'node:fs'

const e1 = readFileSync('docs/results/e1-test-nli-deberta-v3-xsmall-q8.md', 'utf8')
const e2 = readFileSync('docs/results/e2-fact-test-nli-deberta-v3-xsmall.report.md', 'utf8')
const row = (text: string, name: string) => text.split('\n').find((l) => l.startsWith(`| ${name}`))!.split('|').map((c) => c.trim())
const short = (cell: string) => cell.replace(/ \[.*?\]/, '').replace(/ \(n=\d+\)/, '')
const shipped = row(e1, 'Receipts as shipped'), plain = row(e1, 'plain checker')
const unrelatedPlain = plain[8].match(/= ([\d.]+%)/)![1], unrelatedShipped = shipped[8].match(/= ([\d.]+%)/)![1]
const allTest = e2.split('### ')[1]
const r = row(allTest, 'Receipts'), off = row(allTest, 'same thresholds, gate OFF'), pc = row(allTest, 'plain checker')
const header = allTest.split('\n')[0]
const facts = header.match(/— (\d+) facts, (\d+) topics/)!
const lines = [
  `Given an <b>unrelated</b> sentence, the small model on its own calls it a contradiction <b>${unrelatedPlain}</b> of the time; Receipts calls it a conflict <b>${unrelatedShipped}</b> (712 pairs, Symmetric FEVER).`,
  `On <b>real ChatGPT answers</b> with human labels (FActScore; ${facts[1]} facts, ${facts[2]} held-out topics): when Receipts says <b>Backed</b>, humans agree <b>${short(r[3])}</b>. On facts humans found <b>true</b>, Receipts raises a false conflict <b>${short(r[5])}</b> of the time — without the gate: <b>${short(off[5])}</b>.`,
  `Balanced accuracy ${short(r[2])} vs ${short(pc[2])} for a plain "top sentence + raw model" checker. Settings were frozen on separate development topics before this run.`,
]
writeFileSync('web/numbers.json', JSON.stringify({ lines }, null, 1) + '\n')
const md = lines.map((l) => '- ' + l.replace(/<\/?b>/g, '**')).join('\n') + '\n- Full method, baselines, intervals and misses: [docs/eval.md](docs/eval.md)'
const readme = readFileSync('README.md', 'utf8').replace(/<!-- NUMBERS -->[\s\S]*?<!-- \/NUMBERS -->/, `<!-- NUMBERS -->\n${md}\n<!-- /NUMBERS -->`)
writeFileSync('README.md', readme)
console.log(lines.join('\n'))
