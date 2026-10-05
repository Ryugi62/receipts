// Dev-only check: effect of entailNeedsSubject and of an "evidence only from other pages" stress test.
import { readFileSync } from 'node:fs'
import { passesRelevanceGate, aboutSubject } from '../../src/domain/gate'
import { decideVerdict, naiveVerdict } from '../../src/domain/verdict'
const split = process.argv[2] ?? 'dev'
const recs = readFileSync(`docs/results/e2-fact-${split}-nli-deberta-v3-xsmall.jsonl`, 'utf8').trim().split('\n').map((l) => JSON.parse(l))
const chosen = JSON.parse(readFileSync('docs/results/chosen-fact-nli-deberta-v3-xsmall.json', 'utf8'))
const toEv = (r: any, e: any, gate: boolean) => ({ sentence: e.s, page: e.page, url: '', similarity: e.sim, passesGate: gate ? passesRelevanceGate(r.claim, e.s, e.sim, chosen.gate, r.topic) : true, mentionsSubject: aboutSubject(e.s, r.topic, e.page), inference: { entail: e.en, contradict: e.co, neutral: Math.max(0, 1 - e.en - e.co) } })
function run(name: string, f: (r: any, evs: any[]) => string, filter = (r: any, e: any) => true) {
  let tp = 0, fn = 0, tn = 0, fp = 0, b = 0, bS = 0, c = 0, n = 0, unjust = 0
  for (const r of recs) {
    const evs = r.ev.filter((e: any) => filter(r, e))
    const v = f(r, evs)
    n++
    const flag = v !== 'backed'
    if (r.label === 'NS') flag ? tp++ : fn++; else flag ? fp++ : tn++
    if (v === 'backed') { b++; if (r.label === 'S') bS++ }
    if (v === 'contradicted') c++
  }
  console.log(`${name}: bal ${((tp / (tp + fn) + tn / (tn + fp)) / 2 * 100).toFixed(1)} backedPrec ${(bS / b * 100).toFixed(1)} (n=${b}) conflicts ${c} of ${n}`)
}
const R = (sub: boolean) => (r: any, evs: any[]) => decideVerdict(evs.map((e) => toEv(r, e, true)), { ...chosen.thresholds, entailNeedsSubject: sub }).label
const P = (r: any, evs: any[]) => naiveVerdict(evs.map((e) => toEv(r, e, false))).label
run('Receipts (shipped)', R(false)); run('Receipts entailNeedsSubject', R(true)); run('plain', P)
const otherPages = (r: any, e: any) => !aboutSubject(e.page, r.topic, null)
console.log('--- stress: only evidence from OTHER pages (as if the subject had no article); ideal = no verdict')
run('Receipts (shipped)', R(false), otherPages); run('Receipts entailNeedsSubject', R(true), otherPages); run('plain', P, otherPages)
