import { describe, it, expect } from 'vitest'
import { cleanForInference, normalizeDates, subjectName } from '../src/domain/evidence'
import { splitSentences, splitClaims, resolvePronoun } from '../src/domain/claims'

describe('subjectName (SPEC §11 bug fix)', () => {
  it('drops a trailing disambiguation', () => {
    expect(subjectName('Miguel Díaz (baseball)')).toBe('Miguel Díaz')
    expect(subjectName('Marie Curie')).toBe('Marie Curie')
  })
  it('is used when a pronoun is resolved in a claim', () => {
    expect(resolvePronoun('He was signed by the Brewers.', 'Miguel Díaz (baseball)')).toBe('Miguel Díaz was signed by the Brewers.')
  })
})

describe('splitSentences abbreviations (SPEC §11)', () => {
  it('does not cut at fl. / c. / b.', () => {
    expect(splitSentences('Quintus Sosius Senecio (fl. 1st century AD) was a Roman senator. He was consul.')).toEqual([
      'Quintus Sosius Senecio (fl. 1st century AD) was a Roman senator.', 'He was consul.',
    ])
    expect(splitSentences('The temple was built c. 500 BC by the king. It burned.')).toHaveLength(2)
  })
})

describe('normalizeDates', () => {
  it('writes month-day-year as day month year', () => {
    expect(normalizeDates('born on August 29, 1993, in Wolverhampton')).toBe('born on 29 August 1993, in Wolverhampton')
    expect(normalizeDates('Sept. 3, 1901')).toBe('3 September 1901')
    expect(normalizeDates('in May 2001')).toBe('in May 2001')
  })
})

describe('cleanForInference (SPEC §11 option)', () => {
  it('replaces a leading pronoun with the page subject', () => {
    expect(cleanForInference('He was a member of the pop band One Direction.', 'Liam Payne')).toBe('Liam Payne was a member of the pop band One Direction.')
    expect(cleanForInference("Her debut album was released in 2010.", 'Adele')).toBe("Adele's debut album was released in 2010.")
    expect(cleanForInference('He scored twice.', 'Miguel Díaz (baseball)')).toBe('Miguel Díaz scored twice.')
  })
  it('drops native-script and language-gloss segments but keeps the rest of the parenthesis', () => {
    expect(cleanForInference('Ko Itakura (板倉 滉, Itakura Kō; born 27 January 1997) is a Japanese footballer.', 'Ko Itakura'))
      .toBe('Ko Itakura (born 27 January 1997) is a Japanese footballer.')
    expect(cleanForInference('Ra Jong-yil (Korean: 라종일; born 1940) is a former ambassador.', 'Ra Jong-yil'))
      .toBe('Ra Jong-yil (born 1940) is a former ambassador.')
    expect(cleanForInference('Paris (French: Paris) is a city.', 'Paris')).toBe('Paris is a city.')
  })
  it('normalizes dates and leaves ordinary sentences alone', () => {
    expect(cleanForInference('Curie was born on November 7, 1867.', 'Marie Curie')).toBe('Curie was born on 7 November 1867.')
    expect(cleanForInference('The museum has a garden.', 'Louvre')).toBe('The museum has a garden.')
  })
  it('does not touch a pronoun when there is no page subject', () => {
    expect(cleanForInference('He won.', null)).toBe('He won.')
  })
})

describe('splitClaims keeps the full topic for search but a clean name in text', () => {
  it('uses the subject name in claim text', () => {
    const c = splitClaims('He pitched for the Brewers.', 'Miguel Díaz (baseball)')
    expect(c[0].text).toBe('Miguel Díaz pitched for the Brewers.')
    expect(c[0].topic).toBe('Miguel Díaz (baseball)')
  })
})
