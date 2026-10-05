import { describe, it, expect } from 'vitest'
import { toInference } from '../src/adapters/transformers'

describe('toInference', () => {
  it('follows the model label order (SNLI-style and MNLI-style heads differ)', () => {
    const a = toInference([5, 0, 0], { 0: 'contradiction', 1: 'entailment', 2: 'neutral' })
    expect(a.contradict).toBeGreaterThan(0.9)
    const b = toInference([5, 0, 0], { 0: 'entailment', 1: 'neutral', 2: 'contradiction' })
    expect(b.entail).toBeGreaterThan(0.9)
    expect(b.entail + b.neutral + b.contradict).toBeCloseTo(1, 6)
  })
})
