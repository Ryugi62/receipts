// Revision 3 selection (SPEC §11), ChatGPT dev only, on one run that stores raw and cleaned scores for the same sentences.
// Usage: npx tsx scripts/sweep3.ts [--file <dev run with en2/co2>] [--ks 5,8,10] [--out-tag topk]
import { readFileSync, writeFileSync } from 'node:fs'
import { passesRelevanceGate, aboutSubject, type GateConfig } from '../src/domain/gate'
import { decideVerdict, naiveVerdict, type Thresholds, type Verdict } from '../src/domain/verdict'
import { arg, pct, readJsonl } from './lib'

type Ev = { s: string; page: string; sim: number; en: number; co: number; en2: number; co2: number }
type Rec = { key: string; topic: string | null; claim: string; label: 'S' | 'NS'; ev: Ev[] }
const devAll = readJsonl(arg('file', 'docs/results/e2-fact-dev-nli-deberta-v3-xsmall-v3.jsonl')!) as Rec[]
const ks = arg('ks', '5')!.split(',').map(Number)
const outTag = arg('out-tag', '')
let dev = devAll
const atK = (k: number) => devAll.map((r) => ({ ...r, ev: r.ev.slice(0, k) }))
const toEv = (r: Rec, e: Ev, gate: GateConfig | null, clean: boolean) => ({
  sentence: e.s, page: e.page, url: '', similarity: e.sim,
  passesGate: gate ? passesRelevanceGate(r.claim, e.s, e.sim, gate, r.topic) : true,
  mentionsSubject: aboutSubject(e.s, r.topic, e.page),
  inference: clean ? { entail: e.en2, contradict: e.co2, neutral: Math.max(0, 1 - e.en2 - e.co2) } : { entail: e.en, contradict: e.co, neutral: Math.max(0, 1 - e.en - e.co) },
})
function m(f: (r: Rec) => Verdict) {
  let tp = 0, fn = 0, tn = 0, fp = 0, b = 0, bS = 0, c = 0, cNS = 0, fc = 0, nS = 0
  for (const r of dev) {
    const v = f(r).label
    const flag = v !== 'backed'
    if (r.label === 'NS') flag ? tp++ : fn++
    else { flag ? fp++ : tn++; nS++; if (v === 'contradicted') fc++ }
    if (v === 'backed') { b++; if (r.label === 'S') bS++ }
    if (v === 'contradicted') { c++; if (r.label === 'NS') cNS++ }
  }
  return { bal: (tp / (tp + fn) + tn / (tn + fp)) / 2, backedPrec: b ? bS / b : 0, conflictPrec: c ? cNS / c : 0, conflicts: c, falseConflict: fc / nS, backed: b }
}
dev = atK(5)
const plain = m((r) => naiveVerdict(r.ev.map((e) => toEv(r, e, null, false))))
const v2 = JSON.parse(readFileSync('docs/results/chosen-v2.json', 'utf8')) as { gate: GateConfig; thresholds: Thresholds }
const v2raw = m((r) => decideVerdict(r.ev.map((e) => toEv(r, e, v2.gate, false)), v2.thresholds))
const v2clean = m((r) => decideVerdict(r.ev.map((e) => toEv(r, e, v2.gate, true)), v2.thresholds))
const grid: { gate: GateConfig; t: Thresholds }[] = []
for (const minSimilarity of [0.2, 0.3, 0.4, 0.5]) for (const minSharedTokens of [0, 1, 2]) for (const ignoreTopicTokens of [false, true])
  for (const entail of [0.5, 0.6, 0.7, 0.8, 0.9]) for (const contradict of [0.5, 0.7, 0.9, 0.97]) for (const contradictNeedsSubject of [false, true])
    for (const entailNeedsSubject of [false, true]) for (const conflictFromTopOnly of [false, true]) for (const disagreement of ['contradicted', 'no_receipt'] as const)
      grid.push({ gate: { minSimilarity, minSharedTokens, ignoreTopicTokens }, t: { entail, contradict, contradictNeedsSubject, entailNeedsSubject, conflictFromTopOnly, disagreement } })
type Cand = { gate: GateConfig; t: Thresholds; m: ReturnType<typeof m>; k: number; clean: boolean }
const perArm: string[] = []
let pool: Cand[] = [], abcAny = false
for (const k of ks) for (const clean of ks.length > 1 ? [false, true] : [true]) {
  dev = atK(k)
  const all: Cand[] = grid.map((g) => ({ ...g, k, clean, m: m((r) => decideVerdict(r.ev.map((e) => toEv(r, e, g.gate, clean)), g.t)) }))
  const ab = all.filter((x) => x.m.backedPrec >= 0.85 && x.m.falseConflict <= plain.falseConflict)
  const abc = ab.filter((x) => x.m.conflicts >= 20 && x.m.conflictPrec >= plain.conflictPrec)
  abcAny ||= abc.length > 0
  const arm = abc.length ? abc : ab
  const b = [...arm].sort((a, c) => c.m.bal - a.m.bal)[0]
  if (b) perArm.push(`| top ${k}, ${clean ? 'cleaned' : 'raw'} | ${pct(b.m.bal)} | ${pct(b.m.backedPrec)} (n=${b.m.backed}) | ${pct(b.m.conflictPrec)} (n=${b.m.conflicts}) | ${pct(b.m.falseConflict)} | ${arm.length} |`)
  pool = pool.concat(arm)
}
const best = [...pool].sort((a, b) => b.m.bal - a.m.bal)[0]
dev = atK(5)
const ship = best && best.m.bal >= v2raw.bal + 0.01
const rule = abcAny ? 'all of (a)(b)(c)' : '(a)(b) only — no setting met (c)'
const line = (n: string, x: ReturnType<typeof m>) => `| ${n} | ${pct(x.bal)} | ${pct(x.backedPrec)} (n=${x.backed}) | ${pct(x.conflictPrec)} (n=${x.conflicts}) | ${pct(x.falseConflict)} |`
const out = [`# Revision 3 selection on ChatGPT dev (${dev.length} facts, ${new Set(dev.map((r) => r.key.split('|')[0])).size} topics) — SPEC §11`,
  '', '| System (same retrieved sentences) | Balanced accuracy | "Backed" precision | "May conflict" precision | False conflicts on supported |', '|---|---|---|---|---|',
  line('plain checker (raw)', plain), line('v2 settings, raw evidence', v2raw), line('v2 settings, cleaned evidence', v2clean),
  best ? line(`best under the rule (top ${best.k}, ${best.clean ? 'cleaned' : 'raw'})`, best.m) : '| none qualifies | | | | |',
  '', '| Arm (best setting) | Balanced | Backed precision | Conflict precision | False conflicts | Settings qualifying |', '|---|---|---|---|---|---|', ...perArm,
  '', `Rule: ${rule}; ${pool.length} settings qualify across arms.`,
  best ? `Best: top ${best.k}, ${best.clean ? 'cleaned' : 'raw'} evidence, gate ${JSON.stringify(best.gate)}, thresholds ${JSON.stringify(best.t)}` : '',
  `Decision (ship only if ≥ 1.0 point above v2, top 5, raw evidence): **${ship ? `ship (top ${best.k}, cleanEvidence ${best.clean ? 'on' : 'off'})` : 'keep v2 settings (top 5, cleanEvidence off) + bug fixes'}** — ${best ? `${pct(best.m.bal)} vs ${pct(v2raw.bal)}` : 'no qualifying setting'}.`].join('\n')
console.log(out)
writeFileSync(`docs/results/v3-selection${outTag ? '-' + outTag : ''}.md`, out + '\n')
writeFileSync('docs/results/chosen-v3.json', JSON.stringify(ship ? { gate: best.gate, thresholds: best.t, cleanEvidence: best.clean, topK: best.k } : { ...v2, cleanEvidence: false, topK: 5 }, null, 1))
