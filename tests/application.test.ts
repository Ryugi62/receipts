import { describe, it, expect } from 'vitest'
import { checkAnswer, swapTest, type Deps } from '../src/application/checkAnswer'

// Fakes: lexical similarity, and an NLI that entails when the claim's year appears in the premise,
// contradicts when another year appears, and (like real SNLI-style models) contradicts unrelated text.
const lexical = async (claim: string, sentences: string[]) => {
  const c = new Set(claim.toLowerCase().match(/\w+/g))
  return sentences.map((s) => {
    const w = s.toLowerCase().match(/\w+/g) ?? []
    return w.filter((x) => c.has(x)).length / Math.max(4, w.length)
  })
}
const fakeNli: Deps['nli'] = {
  async infer(pairs) {
    return pairs.map(({ premise, hypothesis }) => {
      const year = hypothesis.match(/\b(1[89]\d\d|20\d\d)\b/)?.[0]
      const pyear = premise.match(/\b(1[89]\d\d|20\d\d)\b/)?.[0]
      if (year && pyear === year) return { entail: 0.95, contradict: 0.02, neutral: 0.03 }
      return { entail: 0.02, contradict: 0.95, neutral: 0.03 }
    })
  },
}
const queries: string[] = []
const deps: Deps = {
  source: {
    async pagesFor(q) {
      queries.push(JSON.stringify(q))
      return [{ title: 'Marie Curie', url: 'https://en.wikipedia.org/wiki/Marie_Curie', text: 'Marie Curie was born in 1867 in Warsaw. Curie won the Nobel Prize in Physics in 1903. The museum has a large garden with many old trees.' }]
    },
  },
  ranker: { similarities: lexical },
  nli: fakeNli,
}

describe('checkAnswer', () => {
  it('backs, contradicts and refuses to judge with the receipt sentence', async () => {
    queries.length = 0
    const answer = 'Marie Curie was born in 1867. She won the Nobel Prize in Physics in 1911. I hope this helps!'
    const res = await checkAnswer(answer, deps)
    expect(res.map((r) => r.verdict.label)).toEqual(['backed', 'contradicted'])
    expect(res[0].verdict.receipts[0].sentence).toBe('Marie Curie was born in 1867 in Warsaw.')
    expect(res[1].verdict.receipts[0].sentence).toBe('Curie won the Nobel Prize in Physics in 1903.')
    // G/W/T 6: the source never receives the whole answer
    expect(queries.every((q) => !q.includes('I hope this helps'))).toBe(true)
    expect(queries.length).toBe(2)
    expect(res[0].parts.length).toBe(1)
  })
  it('G/W/T 3+7: an unrelated sentence the model calls a contradiction ends as no_receipt', async () => {
    const v = await swapTest('Marie Curie was born in 1867.', { sentence: 'The river flows north through a wide valley.', page: 'River', url: 'u' }, deps)
    expect(v.label).toBe('no_receipt')
  })
})
