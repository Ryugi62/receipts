import { describe, it, expect } from 'vitest'
import { decomposeClaim, splitClaims } from '../src/domain/claims'

const v4 = (s: string, t: string | null) => decomposeClaim(s, t, { v4: true })

describe('splitter v4 (SPEC §13, rules from dev sentences)', () => {
  it('splits a list of roles after "is/was a(n)"', () => {
    expect(v4('Michael Valpy is a Canadian journalist, author, and academic.', 'Michael Valpy')).toEqual([
      'Michael Valpy is a Canadian journalist.', 'Michael Valpy is an author.', 'Michael Valpy is an academic.',
    ])
    expect(v4('Bella Akhmadulina was a Soviet and Russian poet, writer, and translator.', 'Bella Akhmadulina')).toEqual([
      'Bella Akhmadulina was a Soviet and Russian poet.', 'Bella Akhmadulina was a writer.', 'Bella Akhmadulina was a translator.',
    ])
  })
  it('splits a trailing list of names or titles', () => {
    expect(v4('He has also played for the San Francisco Giants and the Pittsburgh Pirates.', 'Eric Hacker')).toEqual([
      'He has also played for the San Francisco Giants.', 'He has also played for the Pittsburgh Pirates.',
    ])
    expect(v4('Katsu\'s novels include "The Taker" trilogy, "The Hunger", "The Deep", and "Red Widow".', 'Alma Katsu')).toEqual([
      'Katsu\'s novels include "The Taker" trilogy.', 'Katsu\'s novels include "The Hunger".', 'Katsu\'s novels include "The Deep".', 'Katsu\'s novels include "Red Widow".',
    ])
  })
  it('splits ", where he/she …" and "born on …" and "and later …"', () => {
    expect(v4("Díaz spent his first three seasons in the Brewers' minor league system, where he pitched as a starter and reliever.", 'Miguel Díaz')).toEqual([
      "Díaz spent his first three seasons in the Brewers' minor league system.", 'Miguel Díaz pitched as a starter and reliever.',
    ])
    expect(v4('Gonzalo Fonseca was a Uruguayan sculptor and painter born on July 2, 1922, in Montevideo, Uruguay.', 'Gonzalo Fonseca')).toEqual([
      'Gonzalo Fonseca was a Uruguayan sculptor and painter.', 'Gonzalo Fonseca was born on July 2, 1922, in Montevideo, Uruguay.',
    ])
    expect(v4('He was a pastor in South Africa for many years and later served as the Executive Director of the Embassy.', 'Malcolm Hedding')).toEqual([
      'He was a pastor in South Africa for many years.', 'Malcolm Hedding served as the Executive Director of the Embassy.',
    ])
  })
  it('leaves sentences without these shapes alone, and the default splitter unchanged', () => {
    expect(v4('Paris is the capital of France.', null)).toEqual(['Paris is the capital of France.'])
    expect(v4('She starred in "Up" and "Down" in 1927.', 'Ann Lee')).toEqual(['She starred in "Up" and "Down" in 1927.'])
    expect(decomposeClaim('Michael Valpy is a Canadian journalist, author, and academic.', 'Michael Valpy')).toEqual(['Michael Valpy is a Canadian journalist, author, and academic.'])
  })
  it('splitClaims passes the option through', () => {
    expect(splitClaims('Ann Lee is an American actor, singer, and dancer.', undefined, { v4: true })[0].parts).toHaveLength(3)
  })
})

describe('splitter v4 — commas inside quotes', () => {
  it('handles "The String," "The Garden," and "The Shiver."', () => {
    expect(v4('Akhmadulina published collections, including "The String," "The Garden," and "The Shiver."', 'Bella Akhmadulina')).toEqual([
      'Akhmadulina published collections, including "The String".', 'Akhmadulina published collections, including "The Garden".', 'Akhmadulina published collections, including "The Shiver".',
    ])
  })
})
