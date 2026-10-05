import { describe, it, expect } from 'vitest'
import { splitSentences, splitClaims, guessTopic } from '../src/domain/claims'
import { passesRelevanceGate, contentTokens, lexicalPrefilter } from '../src/domain/gate'
import { decideVerdict, aggregateVerdicts, naiveVerdict, DEFAULT_THRESHOLDS, type ScoredEvidence } from '../src/domain/verdict'

describe('splitSentences', () => {
  it('does not split on abbreviations, initials or decimals', () => {
    const s = splitSentences('Dr. J. R. R. Tolkien was born in 1892. He wrote 3.5 books in the U.S. today. Really?')
    expect(s).toEqual(['Dr. J. R. R. Tolkien was born in 1892.', 'He wrote 3.5 books in the U.S. today.', 'Really?'])
  })
})

describe('guessTopic', () => {
  it('takes the leading name before is/was', () => {
    expect(guessTopic('Lanny Flaherty is an American actor born in 1949.')).toBe('Lanny Flaherty')
    expect(guessTopic('The Eiffel Tower was completed in 1889.')).toBe('The Eiffel Tower')
  })
})

describe('splitClaims (G/W/T 1)', () => {
  it('replaces a sentence-initial pronoun with the topic and skips non-claims', () => {
    const claims = splitClaims('Marie Curie was a physicist. She won two Nobel Prizes. Her husband was Pierre Curie. I hope this helps! Do you want more?')
    expect(claims.map((c) => c.text)).toEqual([
      'Marie Curie was a physicist.',
      'Marie Curie won two Nobel Prizes.',
      "Marie Curie's husband was Pierre Curie.",
    ])
    expect(claims[1].original).toBe('She won two Nobel Prizes.')
    expect(claims.every((c) => c.topic === 'Marie Curie')).toBe(true)
  })
  it('skips assistant boilerplate', () => {
    expect(splitClaims("As an AI language model, I don't have personal opinions. Paris is the capital of France.").map((c) => c.text))
      .toEqual(['Paris is the capital of France.'])
  })
})

describe('relevance gate', () => {
  it('keeps content tokens and drops stopwords', () => {
    expect(contentTokens('She won two Nobel Prizes in 1911.')).toEqual(['won', 'two', 'nobel', 'prizes', '1911'])
  })
  it('passes only with similarity above the bar AND a shared content token', () => {
    expect(passesRelevanceGate('Marie Curie won two Nobel Prizes.', 'Curie is the only person to win Nobel Prizes in two sciences.', 0.6)).toBe(true)
    expect(passesRelevanceGate('Marie Curie won two Nobel Prizes.', 'The river flows north through the valley.', 0.9)).toBe(false)
    expect(passesRelevanceGate('Marie Curie won two Nobel Prizes.', 'Curie studied in Paris.', 0.1)).toBe(false)
  })
  it('can ignore the topic name so "same person, different fact" sentences do not pass on the name alone', () => {
    const cfg = { minSimilarity: 0.3, minSharedTokens: 1, ignoreTopicTokens: true }
    expect(passesRelevanceGate('Marie Curie won two Nobel Prizes.', 'Marie Curie was born in Warsaw.', 0.5, cfg, 'Marie Curie')).toBe(false)
    expect(passesRelevanceGate('Marie Curie won two Nobel Prizes.', 'Curie shared the 1903 Nobel Prize.', 0.5, cfg, 'Marie Curie')).toBe(true)
  })
})

const ev = (sentence: string, entail: number, contradict: number, passes = true): ScoredEvidence => ({
  sentence, url: 'https://en.wikipedia.org/wiki/X', page: 'X', similarity: 0.7, passesGate: passes,
  inference: { entail, contradict, neutral: Math.max(0, 1 - entail - contradict) },
})

describe('decideVerdict (G/W/T 2–5)', () => {
  it('2: backed with the receipt', () => {
    const v = decideVerdict([ev('A', 0.92, 0.02), ev('B', 0.1, 0.1)], DEFAULT_THRESHOLDS)
    expect(v.label).toBe('backed')
    expect(v.receipts[0].sentence).toBe('A')
  })
  it('3: an ungated contradiction never becomes contradicted', () => {
    const v = decideVerdict([ev('unrelated', 0.01, 0.97, false)], DEFAULT_THRESHOLDS)
    expect(v.label).toBe('no_receipt')
    expect(v.receipts).toEqual([])
  })
  it('4: contradicted with the receipt', () => {
    const v = decideVerdict([ev('C', 0.05, 0.9), ev('D', 0.2, 0.1)], DEFAULT_THRESHOLDS)
    expect(v.label).toBe('contradicted')
    expect(v.receipts[0].sentence).toBe('C')
  })
  it('5: sources disagree -> contradicted with both receipts', () => {
    const v = decideVerdict([ev('E', 0.95, 0.01), ev('F', 0.02, 0.93)], DEFAULT_THRESHOLDS)
    expect(v.label).toBe('contradicted')
    expect(v.disagreement).toBe(true)
    expect(v.receipts.map((r) => r.sentence).sort()).toEqual(['E', 'F'])
  })
  it('no evidence at all -> no_receipt', () => {
    expect(decideVerdict([], DEFAULT_THRESHOLDS).label).toBe('no_receipt')
  })
})

describe('lexicalPrefilter', () => {
  it('keeps the sentences sharing the most claim words, in page order on ties', () => {
    const c = ['The cat sat.', 'Curie won the Nobel Prize.', 'Nobel Prize in Physics 1903 went to Curie.', 'Rain fell.'].map((sentence) => ({ sentence }))
    expect(lexicalPrefilter('Curie won the Nobel Prize in Physics in 1903.', c, 2).map((x) => x.sentence))
      .toEqual(['Nobel Prize in Physics 1903 went to Curie.', 'Curie won the Nobel Prize.'])
  })
})

import { decomposeClaim, sentenceSubject } from '../src/domain/claims'
import { mentionsSubject, aboutSubject } from '../src/domain/gate'

describe('decomposeClaim (atomic parts)', () => {
  it('splits birth–death parentheses, relative clauses and coordinated verbs', () => {
    expect(decomposeClaim('Julia Faye (born September 24, 1893 – April 6, 1966) was an American actress who appeared in over 200 films.', 'Julia Faye')).toEqual([
      'Julia Faye was an American actress.',
      'Julia Faye appeared in over 200 films.',
      'Julia Faye was born on September 24, 1893.',
      'Julia Faye died on April 6, 1966.',
    ])
    expect(decomposeClaim('Julia Faye began her career as a child actress in 1913, and worked extensively as an extra.', 'Julia Faye')).toEqual([
      'Julia Faye began her career as a child actress in 1913.',
      'Julia Faye worked extensively as an extra.',
    ])
    expect(decomposeClaim("Faye's career declined in the 1930s, and she retired from acting in 1943.", 'Julia Faye')).toEqual([
      "Faye's career declined in the 1930s.",
      'Julia Faye retired from acting in 1943.',
    ])
  })
  it('leaves simple sentences and noun lists alone', () => {
    expect(decomposeClaim('Paris is the capital of France.', null)).toEqual(['Paris is the capital of France.'])
    expect(decomposeClaim('She starred in "Up" and "Down" in 1927.', 'Ann Lee')).toEqual(['She starred in "Up" and "Down" in 1927.'])
  })
  it('finds the sentence subject', () => {
    expect(sentenceSubject('The Eiffel Tower was completed in 1889.')).toBe('The Eiffel Tower')
  })
  it('splitSentences keeps "Warner Bros. Studios" together', () => {
    expect(splitSentences('Faye joined Warner Bros. Studios in 1920. She left.')).toEqual(['Faye joined Warner Bros. Studios in 1920.', 'She left.'])
  })
})

describe('mentionsSubject', () => {
  it('needs a name token of the topic (surname counts) in the sentence', () => {
    expect(mentionsSubject("Faye's career declined.", 'Julia Faye')).toBe(true)
    expect(mentionsSubject("Faye's father died before 1901.", 'Julia Faye')).toBe(false)
    expect(mentionsSubject('Her father died before 1901.', 'Julia Faye')).toBe(false)
    expect(mentionsSubject('Julia Ward was born in New York City on May 27, 1819.', 'Julia Faye')).toBe(false)
    expect(mentionsSubject('anything', null)).toBe(true)
  })
})

describe('contradiction needs the subject', () => {
  it('a contradiction from a sentence not about the subject is not shown when the gate asks for it', () => {
    const e = { ...ev('Her father died before 1901.', 0.01, 0.95), mentionsSubject: false }
    expect(decideVerdict([e], { ...DEFAULT_THRESHOLDS, contradictNeedsSubject: true }).label).toBe('no_receipt')
    expect(decideVerdict([{ ...e, mentionsSubject: true }], { ...DEFAULT_THRESHOLDS, contradictNeedsSubject: true }).label).toBe('contradicted')
  })
})

describe('aggregateVerdicts', () => {
  it('any contradicted part wins; all backed → backed; else no_receipt with the backed count', () => {
    const b = decideVerdict([ev('A', 0.9, 0)]), c = decideVerdict([ev('C', 0, 0.9)]), n = decideVerdict([])
    expect(aggregateVerdicts([b, c]).label).toBe('contradicted')
    expect(aggregateVerdicts([b, b]).label).toBe('backed')
    const m = aggregateVerdicts([b, n])
    expect([m.label, m.backedParts]).toEqual(['no_receipt', 1])
  })
})

describe('aboutSubject', () => {
  it('pronoun sentences count on the subject page, not elsewhere, and never "Her father …"', () => {
    expect(aboutSubject('She retired from acting in 1998.', 'Marianne McAndrew', 'Marianne McAndrew')).toBe(true)
    expect(aboutSubject('She retired from acting in 1998.', 'Marianne McAndrew', 'Marianne Faithfull')).toBe(false)
    expect(aboutSubject('Her father died in 1901.', 'Julia Faye', 'Julia Faye')).toBe(false)
    expect(aboutSubject('Marianne Faithfull was an English singer.', 'Marianne McAndrew', 'Marianne Faithfull')).toBe(false)
  })
  it('a backing sentence about someone else does not back the claim when asked', () => {
    const e = { ...ev('Faithfull was an English singer.', 0.97, 0.01), mentionsSubject: false }
    expect(decideVerdict([e], { ...DEFAULT_THRESHOLDS, entailNeedsSubject: true }).label).toBe('no_receipt')
  })
})

describe('naiveVerdict (baseline)', () => {
  it('takes the most similar sentence and its NLI label, ignoring the gate', () => {
    const top = { ...ev("Faye's father died before 1901.", 0.01, 0.95, false), similarity: 0.9 }
    const other = { ...ev('Faye died on April 6, 1966.', 0.9, 0.01), similarity: 0.5 }
    expect(naiveVerdict([other, top]).label).toBe('contradicted')
    expect(decideVerdict([other, top], DEFAULT_THRESHOLDS).label).toBe('backed')
  })
})
