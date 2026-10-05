// Infrastructure: browser UI wiring. All logic lives in src/.
import { env } from '@huggingface/transformers'
import { checkAnswer, scoreEvidence, type ClaimResult, type CheckOptions } from '../src/application/checkAnswer'
import { decideVerdict } from '../src/domain/verdict'
import { contentTokens } from '../src/domain/gate'
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

const deps = {
  source: new WikipediaSource({ searchPages: 2 }),
  ranker: new TransformersRanker(undefined, onProgress),
  nli: new TransformersNli(config.model, 'q8', onProgress),
}
const opts: CheckOptions = { topK: 5, gate: config.gate, thresholds: config.thresholds }

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
    answerEl.focus()
  }),
)

const LABEL: Record<string, string> = { backed: 'Backed', contradicted: 'May conflict', no_receipt: 'No receipt' }
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
const p = (x: number) => `${Math.round(100 * x)}%`

// Unrelated sentences for the swap test — the one sharing the fewest words with the claim is used.
const UNRELATED = [
  'The Amazon River flows through Peru, Colombia and Brazil before reaching the Atlantic Ocean.',
  'Photosynthesis converts light energy into chemical energy stored in glucose.',
  'The Great Barrier Reef is the largest coral reef system in the world.',
]
function pickUnrelated(claim: string) {
  const c = new Set(contentTokens(claim))
  return UNRELATED.map((s) => ({ s, k: contentTokens(s).filter((w) => c.has(w)).length })).sort((a, b) => a.k - b.k)[0].s
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
        <div class="row"><button class="ghost" data-swap="${i}">Swap test</button><span class="swap muted" data-swap-out="${i}"></span></div>
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
  el.querySelectorAll<HTMLButtonElement>('[data-swap]').forEach((b) =>
    b.addEventListener('click', async () => {
      const i = Number(b.dataset.swap)
      const text = r.parts[i].text
      const out = el.querySelector(`[data-swap-out="${i}"]`)!
      b.disabled = true
      out.textContent = 'Running…'
      const s = pickUnrelated(text)
      const scored = await scoreEvidence(text, [{ sentence: s, page: 'unrelated', url: '' }], deps, { ...opts, topK: 1 }, r.claim.topic)
      const gated = decideVerdict(scored, opts.thresholds)
      const raw = scored[0].inference
      out.innerHTML = `Given “${esc(s)}” → raw model: backs ${p(raw.entail)}, contradicts ${p(raw.contradict)} · Receipts: <b>${LABEL[gated.label]}</b>${gated.label === 'no_receipt' ? ' ✓ it read the evidence' : ''}`
      b.disabled = false
    }),
  )
}

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
    $('sum-big').textContent = `${counts.backed} of ${parts} claims backed`
    $('sum-line').textContent = `${counts.contradicted} may conflict with Wikipedia · ${counts.no_receipt} with no receipt — check those before you use them. (${all.length} sentences, ${((performance.now() - t0) / 1000).toFixed(0)} s)`
  } catch (e) {
    statusText.textContent = `Something went wrong: ${(e as Error).message}. Wikipedia may be busy — try again in a minute.`
  } finally {
    btn.disabled = false
  }
})
