// Revision 3 report (SPEC §11): v3 vs v2 vs plain checker on the same retrieved sentences (raw and cleaned scores stored per
// sentence), paired topic bootstrap, and the triage view. Works at fact or sentence level.
// Usage: npx tsx scripts/v3-report.ts --file docs/results/<run>.jsonl --title "…" [--out docs/results/<name>.md]
import { readFileSync, writeFileSync } from 'node:fs'
import { passesRelevanceGate, aboutSubject, type GateConfig } from '../src/domain/gate'
import { decideVerdict, aggregateVerdicts, naiveVerdict, type Thresholds, type Verdict } from '../src/domain/verdict'
import { arg, pct, readJsonl } from './lib'

type Ev = { s: string; page: string; sim: number; en: number; co: number; en2?: number; co2?: number }
type Rec = { key: string; topic: string | null; claim: string; label: 'S' | 'NS'; ev?: Ev[]; parts?: { text: string; ev: Ev[] }[] }
type Chosen = { gate: GateConfig; thresholds: Thresholds; cleanEvidence?: boolean; topK?: number }
const file = arg('file')!
const title = arg('title', file)!
const recs = readJsonl(file) as Rec[]
const v2 = JSON.parse(readFileSync('docs/results/chosen-v2.json', 'utf8')) as Chosen
const v3 = JSON.parse(readFileSync('docs/results/chosen-v3.json', 'utf8')) as Chosen
const OFF: GateConfig = { minSimilarity: -2, minSharedTokens: 0, ignoreTopicTokens: false }
const toEv = (claim: string, topic: string | null, e: Ev, gate: GateConfig, clean: boolean) => ({
  sentence: e.s, page: e.page, url: '', similarity: e.sim, passesGate: passesRelevanceGate(claim, e.s, e.sim, gate, topic),
  mentionsSubject: aboutSubject(e.s, topic, e.page),
  inference: clean && e.en2 !== undefined ? { entail: e.en2, contradict: e.co2!, neutral: Math.max(0, 1 - e.en2 - e.co2!) } : { entail: e.en, contradict: e.co, neutral: Math.max(0, 1 - e.en - e.co) },
})
type Part = (claim: string, topic: string | null, ev: Ev[]) => Verdict
const R = (c: Chosen, clean: boolean, k = 5): Part => (cl, t, ev) => decideVerdict(ev.slice(0, k).map((e) => toEv(cl, t, e, c.gate, clean)), c.thresholds)
const systems: [string, Part][] = [
  [`Receipts v3 (top ${v3.topK ?? 5}, ${v3.cleanEvidence ? 'cleaned' : 'raw'} evidence, frozen on dev)`, R(v3, !!v3.cleanEvidence, v3.topK ?? 5)],
  ['Receipts v2 (raw evidence)', R(v2, false)],
  ['plain checker (top sentence + raw NLI label)', (cl, t, ev) => naiveVerdict(ev.slice(0, 5).map((e) => toEv(cl, t, e, OFF, false)))],
]
// When the shipped v3 settings are the v2 settings, show one row for it.
const same = !v3.cleanEvidence && (v3.topK ?? 5) === 5 && JSON.stringify(v3.gate) === JSON.stringify(v2.gate) && JSON.stringify(v3.thresholds) === JSON.stringify(v2.thresholds)
if (same) { systems.shift(); systems[0][0] = 'Receipts (v2 settings, as shipped)' }
const BASE = same ? 0 : 1
const verdict = (p: Part, r: Rec) => (r.parts ? aggregateVerdicts(r.parts.map((x) => p(x.text, r.topic, x.ev))) : p(r.claim, r.topic, r.ev ?? [])).label
type Pre = { topic: string; label: 'S' | 'NS'; v: string[] }
const rs: Pre[] = recs.map((r) => ({ topic: r.key.split('|')[0], label: r.label, v: systems.map(([, p]) => verdict(p, r)) }))
function score(xs: Pre[], i: number) {
  let tp = 0, fn = 0, tn = 0, fp = 0, b = 0, bS = 0, fc = 0, nS = 0, c = 0, cNS = 0
  for (const r of xs) {
    const v = r.v[i], flag = v !== 'backed'
    if (r.label === 'NS') flag ? tp++ : fn++
    else { nS++; flag ? fp++ : tn++; if (v === 'contradicted') fc++ }
    if (v === 'backed') { b++; if (r.label === 'S') bS++ }
    if (v === 'contradicted') { c++; if (r.label === 'NS') cNS++ }
  }
  return { bal: (tp / Math.max(1, tp + fn) + tn / Math.max(1, tn + fp)) / 2, backedPrec: b ? bS / b : NaN, backed: b, skip: b / xs.length,
    kept: tp / Math.max(1, tp + fn), caught: cNS / Math.max(1, tp + fn), cPrec: c ? cNS / c : NaN, c, flagged: (tp + fp) / xs.length, fc: fc / Math.max(1, nS), backedOfSupported: tn / Math.max(1, tn + fp) }
}
const by = new Map<string, Pre[]>()
for (const r of rs) by.set(r.topic, [...(by.get(r.topic) ?? []), r])
const groups = [...by.values()]
let seed = 7
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648)
const samples = Array.from({ length: 1000 }, () => Array.from({ length: groups.length }, () => groups[Math.floor(rnd() * groups.length)]).flat())
const q = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return [s[25], s[974]] }
const nNS = rs.filter((r) => r.label === 'NS').length
const lines = [`### ${title} — ${rs.length} items, ${groups.length} topics, ${pct(nNS / rs.length)} not supported by humans`, '',
  `| System | Balanced accuracy [95 % CI] | ${same ? 'Receipts' : 'v2'} minus this system (paired 95 % CI) |`+' "Backed" → humans agree | Human-supported items it backs | False conflicts on human-supported | Skip (Backed) | Errors kept in the "check" pile | Random flagging, same amount | Errors named as "May conflict" | "May conflict" → not supported |',
  '|---|---|---|---|---|---|---|---|---|---|---|']
systems.forEach(([name], i) => {
  const m = score(rs, i)
  const ci = q(samples.map((s) => score(s, i).bal))
  const d = i === BASE ? '—' : (() => { const x = q(samples.map((s) => score(s, BASE).bal - score(s, i).bal)); return `${(100 * (score(rs, BASE).bal - m.bal)).toFixed(1)} pts [${(100 * x[0]).toFixed(1)}, ${(100 * x[1]).toFixed(1)}]` })()
  lines.push(`| ${name} | ${pct(m.bal)} [${pct(ci[0])}–${pct(ci[1])}] | ${d} | ${Number.isNaN(m.backedPrec) ? '—' : pct(m.backedPrec)} (n=${m.backed}) | ${pct(m.backedOfSupported)} | ${pct(m.fc)} | ${pct(m.skip)} | ${pct(m.kept)} | ${pct(m.flagged)} | ${pct(m.caught)} | ${Number.isNaN(m.cPrec) ? '—' : pct(m.cPrec)} (n=${m.c}) |`)
})
lines.push('', '"Errors kept in the check pile" = share of human-unsupported items that are not marked Backed. Flagging the same share of items at random would keep that share of errors (last column).')
const out = lines.join('\n')
console.log(out)
const o = arg('out')
if (o) writeFileSync(o, out + '\n')
