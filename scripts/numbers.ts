// Build web/numbers.json (the "How do we know" list on the page) and the README numbers block from committed result files,
// so no number on the page or in the README is typed by hand. Usage: npx tsx scripts/numbers.ts
import { readFileSync, writeFileSync } from 'node:fs'

const e1 = readFileSync('docs/results/e1-test-nli-deberta-v3-xsmall-q8.md', 'utf8')
const e2 = readFileSync('docs/results/e2-fact-test-nli-deberta-v3-xsmall.report.md', 'utf8')
const row = (text: string, name: string) => text.split('\n').find((l) => l.startsWith(`| ${name}`))!.split('|').map((c) => c.trim())
const short = (cell: string) => cell.replace(/ \[.*?\]/, '').replace(/ \(n=\d+\)/, '')
const n = (cell: string) => cell.match(/\(n=(\d+)\)/)![1]
const e1Plain = row(e1, 'plain checker'), e1Ship = row(e1, 'Receipts as shipped')
const unrelatedPlain = e1Plain[8].match(/= ([\d.]+%)/)![1], unrelatedShipped = e1Ship[8].match(/= ([\d.]+%)/)![1]
const [, all, , stress] = e2.split('### ')
const head = all.split('\n')[0].match(/— (\d+) facts, (\d+) topics/)!
const r = row(all, 'Receipts'), pc = row(all, 'plain checker')
const rs = row(stress, 'Receipts'), ps = row(stress, 'plain checker')
const lines = [
  `Given an <b>unrelated</b> sentence, the small model on its own calls it a contradiction <b>${unrelatedPlain}</b> of the time; Receipts: <b>${unrelatedShipped}</b> (712 pairs, Symmetric FEVER).`,
  `<b>Real ChatGPT answers</b> with human labels (FActScore; ${Number(head[1]).toLocaleString('en')} facts on ${head[2]} held-out topics): when Receipts says <b>Backed</b>, humans agree <b>${short(r[3])}</b> (${n(r[3])} facts). Everything else is left for you to check. Overall it is about as accurate as a plain "top sentence + raw model" checker (balanced accuracy ${short(r[2])} vs ${short(pc[2])}).`,
  `When the right article is <b>not</b> found (stress test: other pages only), the plain checker based <b>${ps[6]}</b> conflicts on a sentence about someone or something else; Receipts: <b>${rs[6]}</b>.`,
  `"May conflict" is a hint, not a verdict: on held-out data only ${short(r[4])} of those calls matched a human "not supported" label (base rate ${all.split('\n')[0].match(/topics, ([\d.]+%)/)![1]}).`,
]
writeFileSync('web/numbers.json', JSON.stringify({ lines }, null, 1) + '\n')
const md = lines.map((l) => '- ' + l.replace(/<\/?b>/g, '**')).join('\n') + '\n- Full method, baselines, intervals and misses: [docs/eval.md](docs/eval.md)'
const readme = readFileSync('README.md', 'utf8').replace(/<!-- NUMBERS -->[\s\S]*?<!-- \/NUMBERS -->/, `<!-- NUMBERS -->\n${md}\n<!-- /NUMBERS -->`)
writeFileSync('README.md', readme)
console.log(lines.join('\n'))
