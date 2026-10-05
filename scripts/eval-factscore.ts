// E2 — real chatbot answers. FActScore (Min et al., EMNLP 2023) ChatGPT biographies with human atomic-fact labels
// (S = supported by Wikipedia, NS = not supported; IR = irrelevant, excluded).
// This script runs retrieval (live Wikipedia, disk-cached) + ranking + NLI and stores raw scores; thresholds are chosen
// later on the dev topics only (scripts/sweep.ts) and applied unchanged to test topics.
// Usage: npx tsx scripts/eval-factscore.ts --split dev|test [--level fact|sentence] [--limit N]
import { writeFileSync, mkdirSync, existsSync, readFileSync, appendFileSync } from 'node:fs'
import { TransformersNli, TransformersRanker, NLI_MODEL } from '../src/adapters/transformers'
import { WikipediaSource } from '../src/adapters/wikipedia'
import { scoreEvidence, DEFAULT_OPTIONS } from '../src/application/checkAnswer'
import { splitClaims, splitSentences, resolvePronoun } from '../src/domain/claims'
import { arg, bucket, cachedFetch, readJsonl } from './lib'
import { createHash } from 'node:crypto'

const split = arg('split', 'dev')!
const level = arg('level', 'fact')!
const limit = Number(arg('limit', '100000'))
const data = arg('data', 'ChatGPT')!
const docs = (readJsonl(`data/factscore/${data}.jsonl`) as any[]).filter((d) => d.annotations && d.annotations.length)
// 2 of 5 hash buckets = dev topics, 3 of 5 = test topics (decided before looking at any result).
const sample = Number(arg('sample', '0'))
const inSplit = docs.filter((d) => (bucket(d.topic, 5) < 2 ? 'dev' : 'test') === split)
// --sample N: the N topics with the smallest SHA-1 of the name (a fixed pseudo-random sample, not file order).
const sha = (t: string) => createHash('sha1').update(t).digest('hex')
const mine = (sample ? [...inSplit].sort((a, b) => (sha(a.topic) < sha(b.topic) ? -1 : 1)).slice(0, sample) : inSplit).slice(0, limit)

const wiki = new WikipediaSource({ fetch: cachedFetch() as any, searchPages: 2 })
const modelId = arg('model', NLI_MODEL)!
const deps = { nli: new TransformersNli(modelId, 'q8'), ranker: new TransformersRanker() }
const opts = { ...DEFAULT_OPTIONS, topK: 5 }
mkdirSync('docs/results', { recursive: true })
const tagv = arg('tag', '')
const out = `docs/results/e2-${level}-${split}-${modelId.split('/')[1]}${data === 'ChatGPT' ? '' : '-' + data}${tagv ? '-' + tagv : ''}.jsonl`
const done = new Set(existsSync(out) ? readFileSync(out, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l).key) : [])

const norm = (s: string) => s.replace(/\s+/g, ' ').trim()

async function evidenceFor(claim: string, topic: string | null) {
  const pages = await wiki.pagesFor({ claim, topic })
  const cands = pages.flatMap((p) => splitSentences(p.text).filter((s) => s.split(/\s+/).length >= 4).map((sentence) => ({ sentence, page: p.title, url: p.url })))
  const ev = await scoreEvidence(claim, cands, deps, opts, topic)
  return ev.map((e) => ({ s: e.sentence.slice(0, 400), page: e.page, sim: +e.similarity.toFixed(4), en: +e.inference.entail.toFixed(4), co: +e.inference.contradict.toFixed(4) }))
}

async function run(key: string, topic: string | null, claim: string, label: 'S' | 'NS', extra: object, parts?: string[]) {
  if (done.has(key)) return
  const rec = parts
    ? { key, topic, claim, label, ...extra, parts: await Promise.all(parts.map(async (t) => ({ text: t, ev: await evidenceFor(t, topic) }))) }
    : { key, topic, claim, label, ...extra, ev: await evidenceFor(claim, topic) }
  appendFileSync(out, JSON.stringify(rec) + '\n')
}

let n = 0
const t0 = Date.now()
for (const d of mine) {
  if (level === 'fact') {
    for (const [ai, a] of d.annotations.entries()) {
      for (const [fi, f] of (a['human-atomic-facts'] ?? []).entries()) {
        if (f.label !== 'S' && f.label !== 'NS') continue
        await run(`${d.topic}|${ai}|${fi}`, d.topic, resolvePronoun(f.text, d.topic), f.label, { raw: f.text })
        n++
      }
    }
  } else {
    // Sentence level, fully automatic: our splitter on the raw answer, topic guessed (no hint).
    const gold = new Map<string, 'S' | 'NS'>()
    for (const a of d.annotations) {
      const labs = (a['human-atomic-facts'] ?? []).map((f: any) => f.label).filter((l: string) => l === 'S' || l === 'NS')
      if (labs.length) gold.set(norm(a.text), labs.includes('NS') ? 'NS' : 'S')
    }
    const claims = splitClaims(d.output)
    for (const c of claims) {
      const g = gold.get(norm(c.original))
      if (!g) continue
      await run(`${d.topic}|${c.index}`, c.topic, c.text, g, { topicGuessed: c.topic, topicTrue: d.topic, original: c.original }, c.parts)
      n++
    }
  }
  process.stderr.write(`${d.topic}: ${n} done, ${((Date.now() - t0) / 1000).toFixed(0)} s\n`)
}
writeFileSync(out.replace('.jsonl', '.meta.json'), JSON.stringify({ split, level, topics: mine.length, items: n, model: modelId, runSeconds: Math.round((Date.now() - t0) / 1000), when: new Date().toISOString() }, null, 2))
console.log(`done ${n} items for ${mine.length} topics`)
