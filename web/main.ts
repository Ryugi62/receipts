// Infrastructure: browser UI wiring. All logic lives in src/.
import { env } from '@huggingface/transformers'
import { checkAnswer, type ClaimResult, type CheckOptions, type PartResult } from '../src/application/checkAnswer'
import { naiveVerdict, type Thresholds } from '../src/domain/verdict'
import { WikipediaSource } from '../src/adapters/wikipedia'
import { TransformersNli, TransformersRanker } from '../src/adapters/transformers'
import config from './config.json'
import numbers from './numbers.json'
import samples from './samples.json'

env.allowLocalModels = false

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const answerEl = $<HTMLTextAreaElement>('answer')
const topicEl = $<HTMLInputElement>('topic')
const btn = $<HTMLButtonElement>('check')
const results = $('results')
const statusBox = $('status')
const statusText = $('status-text')
const barFill = $('bar-fill')

const files = new Map<string, { loaded: number; total: number }>()
const onProgress = (p: any) => {
  if (p.status === 'progress' && p.file) files.set(p.file, { loaded: p.loaded ?? 0, total: p.total ?? 1 })
  const all = [...files.values()]
  const loaded = all.reduce((a, f) => a + f.loaded, 0), total = all.reduce((a, f) => a + f.total, 0)
  if (total) {
    barFill.style.width = `${Math.min(100, (100 * loaded) / total).toFixed(0)}%`
    statusText.textContent = `Loading the models into your browser (first time only): ${(loaded / 1e6).toFixed(0)} / ${(total / 1e6).toFixed(0)} MB`
  }
}

// Per-tab cache of Wikipedia responses (sessionStorage): re-checking the same answer is fast and sends no new requests.
const cachedFetch = async (url: string) => {
  try {
    const hit = sessionStorage.getItem('w:' + url)
    if (hit) return { ok: true, status: 200, json: async () => JSON.parse(hit) }
  } catch {}
  const r = await fetch(url)
  if (!r.ok) return { ok: false, status: r.status, json: async () => ({}) }
  const body = await r.text()
  try { sessionStorage.setItem('w:' + url, body) } catch {}
  return { ok: true, status: 200, json: async () => JSON.parse(body) }
}

const deps = {
  source: new WikipediaSource({ searchPages: 2, fetch: cachedFetch }),
  ranker: new TransformersRanker(undefined, onProgress),
  nli: new TransformersNli(config.model, 'q8', onProgress),
}
const opts: CheckOptions = { topK: 5, gate: config.gate, thresholds: config.thresholds as Thresholds }

const howList = $('how-numbers')
for (const line of numbers.lines as string[]) {
  const li = document.createElement('li')
  li.innerHTML = line
  howList.appendChild(li)
}

document.querySelectorAll<HTMLButtonElement>('[data-sample]').forEach((b) =>
  b.addEventListener('click', () => {
    const k = b.dataset.sample as keyof typeof samples
    answerEl.value = samples[k]
    topicEl.value = k
    results.innerHTML = ''
    $('summary').hidden = true
    answerEl.focus()
  }),
)

const LABEL: Record<string, string> = { backed: 'Backed', contradicted: 'May conflict', no_receipt: 'No receipt' }
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
const p = (x: number) => `${Math.round(100 * x)}%`

/** When a plain "top sentence + raw model" checker would answer differently, say so and why Receipts did not. */
function naiveNote(pt: PartResult): string {
  const nv = naiveVerdict(pt.evidence)
  if (nv.label === pt.verdict.label || !nv.receipts.length) return ''
  const s = pt.evidence.find((e) => e.sentence === nv.receipts[0].sentence)!
  const why = !s.passesGate
    ? 'that sentence is not close enough to this claim'
    : s.mentionsSubject === false && nv.label === 'contradicted'
      ? 'that sentence is about someone or something else'
      : 'the model was not sure enough'
  return `<p class="naive">⚖︎ A simpler checker would have said <b>${LABEL[nv.label]}</b>, trusting “${esc(s.sentence.slice(0, 160))}${s.sentence.length > 160 ? "…" : ""}” — Receipts set that sentence aside: ${why}.</p>`
}

function receiptHtml(label: string, receipts: { sentence: string; url: string; page: string }[]) {
  return receipts
    .map((rc) => `<blockquote class="${label}">“${esc(rc.sentence)}”<br><a href="${rc.url}" target="_blank" rel="noopener">${esc(rc.page)} — Wikipedia ↗</a></blockquote>`)
    .join('')
}

function render(r: ClaimResult, el: HTMLElement) {
  const v = r.verdict
  const multi = r.parts.length > 1
  const partsHtml = r.parts
    .map((pt, i) => {
      const rows = pt.evidence
        .map((e) => `<tr><td>${esc(e.sentence.slice(0, 220))}</td><td>${p(e.inference.entail)}</td><td>${p(e.inference.contradict)}</td><td>${e.passesGate ? 'yes' : 'no'}</td></tr>`)
        .join('')
      return `<div class="part">
        ${multi ? `<p class="part-text"><span class="pill ${pt.verdict.label}">${LABEL[pt.verdict.label]}</span> ${esc(pt.text)}</p>` : ''}
        ${receiptHtml(pt.verdict.label, pt.verdict.receipts.slice(0, 1)) || (multi ? '' : '<p class="muted small">No sentence on Wikipedia clearly backs or contradicts this. Worth checking yourself.</p>')}
        ${naiveNote(pt)}
        <details><summary>Why? (top ${pt.evidence.length} sentences)</summary>
          <table><tr><th>Sentence</th><th>backs</th><th>contradicts</th><th>relevant?</th></tr>${rows}</table></details>
      </div>`
    })
    .join('')
  const head = multi && v.label === 'no_receipt' && v.backedParts ? `Partly backed · ${v.backedParts}/${r.parts.length}` : LABEL[v.label]
  el.className = 'claim'
  el.innerHTML = `
    <span class="pill ${v.label}">${head}${v.disagreement ? ' · sources disagree' : ''}</span>
    <p class="claim-text">${esc(r.claim.original)}</p>
    ${multi ? `<p class="rewritten">checked as ${r.parts.length} smaller claims:</p>` : r.claim.text !== r.claim.original ? `<p class="rewritten">checked as: “${esc(r.claim.text)}”</p>` : ''}
    ${partsHtml}`
}

let runs = 0
btn.addEventListener('click', async () => {
  const answer = answerEl.value.trim()
  if (!answer) { answerEl.focus(); return }
  btn.disabled = true
  results.innerHTML = ''
  $('summary').hidden = true
  statusBox.hidden = false
  statusText.textContent = 'Getting ready…'
  const t0 = performance.now()
  const counts = { backed: 0, contradicted: 0, no_receipt: 0 }
  let n = 0
  let parts = 0
  try {
    const skeleton = document.createElement('div')
    skeleton.className = 'claim skeleton'
    results.appendChild(skeleton)
    const all = await checkAnswer(answer, deps, { ...opts, topicHint: topicEl.value.trim() || undefined }, (r) => {
      const el = document.createElement('div')
      results.insertBefore(el, skeleton)
      render(r, el)
      for (const pt of r.parts) counts[pt.verdict.label]++
      parts += r.parts.length
      n++
      statusText.textContent = `Checked ${n} claim${n > 1 ? 's' : ''}…`
    })
    skeleton.remove()
    statusBox.hidden = true
    $('summary').hidden = false
    $('summary').dataset.n = String(++runs)
    $('sum-big').textContent = `${counts.backed} of ${parts} claims backed`
    $('sum-line').textContent = `${counts.contradicted} may conflict with Wikipedia · ${counts.no_receipt} with no receipt — check those before you use them. (${all.length} sentences, ${((performance.now() - t0) / 1000).toFixed(0)} s)`
  } catch (e) {
    statusText.textContent = `Something went wrong: ${(e as Error).message}. Wikipedia may be busy — try again in a minute.`
  } finally {
    btn.disabled = false
  }
})
