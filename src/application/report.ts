// What the student takes away after a check: a draft with sources, and a question to send back to the chatbot. Pure, no I/O.
import type { ClaimResult } from './checkAnswer'

const MARK: Record<string, string> = { contradicted: '[check: may conflict]', no_receipt: '[check: no source found]' }

/** The answer, sentence by sentence: backed sentences get a numbered Wikipedia footnote, the others a visible "[check: …]". */
export function citedDraft(results: ClaimResult[]): string {
  const sources: { key: string; line: string }[] = []
  const body = results.map((r) => {
    if (r.verdict.label !== 'backed') return `${r.claim.original} ${MARK[r.verdict.label]}`
    const nums = [...new Set(r.verdict.receipts.map((rc) => {
      let i = sources.findIndex((s) => s.key === rc.url)
      if (i < 0) { sources.push({ key: rc.url, line: `${rc.page} — Wikipedia, ${rc.url}` }); i = sources.length - 1 }
      return i + 1
    }))]
    return `${r.claim.original} ${nums.map((n) => `[${n}]`).join('')}`
  })
  const refs = sources.map((s, i) => `[${i + 1}] ${s.line}`)
  return [body.join(' '), '', 'Sources', ...refs].join('\n').trim()
}

/** A follow-up for the chatbot: the claims Receipts could not back, asking for a checkable source for each. */
export function askBackPrompt(results: ClaimResult[]): string {
  const open = results.filter((r) => r.verdict.label !== 'backed')
  if (!open.length) return ''
  return [
    'For each statement below, give me one source I can check myself (a page title or link) that says exactly this. If you are not sure, say "not sure" instead of guessing.',
    ...open.map((r, i) => {
      const rc = r.verdict.label === 'contradicted' ? r.verdict.receipts[0] : undefined
      return `${i + 1}. ${r.claim.text}${rc ? ` (Wikipedia's "${rc.page}" article says: "${rc.sentence}")` : ''}`
    }),
  ].join('\n')
}
