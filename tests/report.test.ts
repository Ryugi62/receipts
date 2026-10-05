import { describe, it, expect } from 'vitest'
import { citedDraft, askBackPrompt } from '../src/application/report'
import type { ClaimResult } from '../src/application/checkAnswer'

const mk = (original: string, label: 'backed' | 'contradicted' | 'no_receipt', receipt?: { sentence: string; page: string; url: string }): ClaimResult => ({
  claim: { text: original, original, topic: 'Marie Curie', index: 0, parts: [original] },
  verdict: { label, receipts: receipt ? [{ ...receipt, entail: 0.9, contradict: 0 }] : [], disagreement: false, gated: 1, backedParts: label === 'backed' ? 1 : 0 },
  parts: [],
})
const results = [
  mk('Marie Curie was born in 1867.', 'backed', { sentence: 'Curie was born in Warsaw in 1867.', page: 'Marie Curie', url: 'https://en.wikipedia.org/wiki/Marie_Curie' }),
  mk('She won the Nobel Prize in 1911.', 'contradicted', { sentence: 'She won in 1903.', page: 'Marie Curie', url: 'https://en.wikipedia.org/wiki/Marie_Curie' }),
  mk('She loved gardening.', 'no_receipt'),
  mk('She studied in Paris.', 'backed', { sentence: 'She moved to Paris to study.', page: 'Marie Curie', url: 'https://en.wikipedia.org/wiki/Marie_Curie' }),
]

describe('citedDraft (copy with sources)', () => {
  it('footnotes backed sentences, marks the rest, and lists each source once', () => {
    const d = citedDraft(results)
    expect(d).toContain('Marie Curie was born in 1867. [1]')
    expect(d).toContain('She studied in Paris. [1]')
    expect(d).toContain('She won the Nobel Prize in 1911. [check: may conflict]')
    expect(d).toContain('She loved gardening. [check: no source found]')
    expect(d.match(/\[1\] Marie Curie — Wikipedia, https:\/\/en.wikipedia.org\/wiki\/Marie_Curie/g)).toHaveLength(1)
  })
})

describe('askBackPrompt (ask the chatbot for sources)', () => {
  it('uses the claim as checked (pronoun resolved)', () => {
    const r = mk('She loved gardening.', 'no_receipt')
    r.claim.text = 'Marie Curie loved gardening.'
    expect(askBackPrompt([r])).toContain('1. Marie Curie loved gardening.')
  })
  it('lists only the claims without a receipt or with a conflict, numbered', () => {
    const p = askBackPrompt(results)
    expect(p).toContain('1. She won the Nobel Prize in 1911. (Wikipedia\'s "Marie Curie" article says: "She won in 1903.")')
    expect(p).toContain('2. She loved gardening.')
    expect(p).not.toContain('born in 1867')
    expect(p.toLowerCase()).toContain('not sure')
  })
  it('is empty when everything is backed', () => {
    expect(askBackPrompt([results[0]])).toBe('')
  })
})
