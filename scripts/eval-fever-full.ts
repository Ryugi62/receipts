// E4 (SPEC §12): the app's whole path on original FEVER claims (Symmetric FEVER dev+test, synthetic pairs excluded).
// Output rows use the sentence-level format so scripts/v3-report.ts can score them. Usage: npx tsx scripts/eval-fever-full.ts
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { TransformersNli, TransformersRanker, NLI_MODEL } from '../src/adapters/transformers'
import { WikipediaSource } from '../src/adapters/wikipedia'
import { scoreEvidence, DEFAULT_OPTIONS } from '../src/application/checkAnswer'
import { splitClaims, splitSentences } from '../src/domain/claims'
import { cachedFetch, readJsonl } from './lib'

type Row = { id: string; claim: string; label: 'SUPPORTS' | 'REFUTES' }
const rows = (['dev', 'test'] as const).flatMap((s) => (readJsonl(`data/symmetric/fever_symmetric_${s}.jsonl`) as Row[]).filter((r) => r.id.length <= 6))
const out = 'docs/results/e4-fever-full-nli-deberta-v3-xsmall.jsonl'
const done = new Set(existsSync(out) ? readFileSync(out, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l).key) : [])
const wiki = new WikipediaSource({ fetch: cachedFetch() as any, searchPages: 2 })
const deps = { nli: new TransformersNli(NLI_MODEL, 'q8'), ranker: new TransformersRanker() }
const clean = (s: string) => s.replace(/ -LRB- /g, ' (').replace(/ -RRB- ?/g, ') ').replace(/ ([.,;:])/g, '$1').replace(/\s+/g, ' ').trim()
const t0 = Date.now()
let n = 0
for (const r of rows) {
  const key = `${r.id}|0`
  if (done.has(key)) continue
  const text = clean(r.claim)
  const c = splitClaims(text)[0]
  if (!c) continue
  const parts = await Promise.all(c.parts.map(async (p) => {
    const pages = await wiki.pagesFor({ claim: p, topic: c.topic })
    const cands = pages.flatMap((pg) => splitSentences(pg.text).filter((s) => s.split(/\s+/).length >= 4).map((sentence) => ({ sentence, page: pg.title, url: pg.url })))
    const ev = await scoreEvidence(p, cands, deps, DEFAULT_OPTIONS, c.topic)
    return { text: p, ev: ev.map((e) => ({ s: e.sentence.slice(0, 400), page: e.page, sim: +e.similarity.toFixed(4), en: +e.inference.entail.toFixed(4), co: +e.inference.contradict.toFixed(4) })) }
  }))
  appendFileSync(out, JSON.stringify({ key, topic: c.topic, claim: c.text, label: r.label === 'SUPPORTS' ? 'S' : 'NS', fever: r.label, parts }) + '\n')
  if (++n % 25 === 0) process.stderr.write(`${n} claims, ${((Date.now() - t0) / 1000).toFixed(0)} s\n`)
}
writeFileSync(out.replace('.jsonl', '.meta.json'), JSON.stringify({ claims: rows.length, model: NLI_MODEL, runSeconds: Math.round((Date.now() - t0) / 1000), when: new Date().toISOString() }, null, 2))
console.log(`done ${n}`)
