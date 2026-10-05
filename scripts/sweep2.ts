// Revision 2 selection (SPEC §9), ChatGPT dev only. Usage: npx tsx scripts/sweep2.ts
import { readFileSync, writeFileSync } from 'node:fs'
import { passesRelevanceGate, aboutSubject, type GateConfig } from '../src/domain/gate'
import { decideVerdict, naiveVerdict, type Thresholds, type Verdict } from '../src/domain/verdict'
import { pct, readJsonl } from './lib'

type Ev = { s: string; page: string; sim: number; en: number; co: number }
type Rec = { key: string; topic: string | null; claim: string; label: 'S' | 'NS'; ev: Ev[] }
const dev = readJsonl('docs/results/e2-fact-dev-nli-deberta-v3-xsmall.jsonl') as Rec[]
const toEv = (r: Rec, e: Ev, gate: GateConfig | null) => ({
  sentence: e.s, page: e.page, url: '', similarity: e.sim,
  passesGate: gate ? passesRelevanceGate(r.claim, e.s, e.sim, gate, r.topic) : true,
  mentionsSubject: aboutSubject(e.s, r.topic, e.page),
  inference: { entail: e.en, contradict: e.co, neutral: Math.max(0, 1 - e.en - e.co) },
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
  return { bal: (tp / (tp + fn) + tn / (tn + fp)) / 2, backedPrec: b ? bS / b : 0, conflictPrec: c ? cNS / c : 0, conflicts: c, falseConflict: fc / nS }
}
const plain = m((r) => naiveVerdict(r.ev.map((e) => toEv(r, e, null))))
const grid: { gate: GateConfig; t: Thresholds }[] = []
for (const minSimilarity of [0.2, 0.3, 0.4, 0.5]) for (const minSharedTokens of [0, 1, 2]) for (const ignoreTopicTokens of [false, true])
  for (const entail of [0.5, 0.6, 0.7, 0.8, 0.9]) for (const contradict of [0.5, 0.7, 0.9, 0.97]) for (const contradictNeedsSubject of [false, true])
    for (const entailNeedsSubject of [false, true]) for (const conflictFromTopOnly of [false, true]) for (const disagreement of ['contradicted', 'no_receipt'] as const)
      grid.push({ gate: { minSimilarity, minSharedTokens, ignoreTopicTokens }, t: { entail, contradict, contradictNeedsSubject, entailNeedsSubject, conflictFromTopOnly, disagreement } })
const all = grid.map((g) => ({ ...g, m: m((r) => decideVerdict(r.ev.map((e) => toEv(r, e, g.gate)), g.t)) }))
const ab = all.filter((x) => x.m.backedPrec >= 0.85 && x.m.falseConflict <= plain.falseConflict)
const abc = ab.filter((x) => x.m.conflicts >= 20 && x.m.conflictPrec >= plain.conflictPrec)
const pool = abc.length ? abc : ab
const best = [...pool].sort((a, b) => b.m.bal - a.m.bal)[0]
const rule = abc.length ? 'all of (a)(b)(c)' : '(a)(b) only — no setting met (c)'
const out = [`# Revision 2 selection on ChatGPT dev (${dev.length} facts) — SPEC §9`,
  `Plain checker on dev: balanced ${pct(plain.bal)}, Backed precision ${pct(plain.backedPrec)}, conflict precision ${pct(plain.conflictPrec)} (n=${plain.conflicts}), false conflicts on supported ${pct(plain.falseConflict)}.`,
  `Rule met: ${rule}; ${pool.length} of ${grid.length} settings qualify.`,
  `Chosen: gate ${JSON.stringify(best.gate)}, thresholds ${JSON.stringify(best.t)}`,
  `Dev: balanced ${pct(best.m.bal)}, Backed precision ${pct(best.m.backedPrec)}, conflict precision ${pct(best.m.conflictPrec)} (n=${best.m.conflicts}), false conflicts on supported ${pct(best.m.falseConflict)}.`].join('\n')
console.log(out)
writeFileSync('docs/results/v2-selection.md', out + '\n')
writeFileSync('docs/results/chosen-v2.json', JSON.stringify({ gate: best.gate, thresholds: best.t }, null, 1))
