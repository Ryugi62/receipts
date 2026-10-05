import { describe, it, expect } from 'vitest'
import { WikipediaSource, cleanExtract } from '../src/adapters/wikipedia'

describe('WikipediaSource', () => {
  it('searches the topic and the claim, fetches plain-text extracts, and caches pages', async () => {
    const calls: string[] = []
    const fake = async (u: string) => {
      calls.push(u)
      const p = new URL(u).searchParams
      if (p.get('list') === 'search') {
        const s = p.get('srsearch')!
        return { ok: true, status: 200, json: async () => ({ query: { search: s.startsWith('Marie') && !s.includes('won') ? [{ title: 'Marie Curie' }] : [{ title: 'Marie Curie' }, { title: 'Nobel Prize in Physics' }] } }) }
      }
      const t = p.get('titles')!
      return { ok: true, status: 200, json: async () => ({ query: { pages: [{ title: t, extract: `${t} text.\n\nMore text.` }] } }) }
    }
    const w = new WikipediaSource({ fetch: fake })
    const pages = await w.pagesFor({ claim: 'Marie Curie won the Nobel Prize in Physics in 1903.', topic: 'Marie Curie' })
    expect(pages.map((p) => p.title)).toEqual(['Marie Curie', 'Nobel Prize in Physics'])
    expect(pages[0].url).toBe('https://en.wikipedia.org/wiki/Marie_Curie')
    await w.pagesFor({ claim: 'Marie Curie won the Nobel Prize in Physics in 1903.', topic: 'Marie Curie' })
    expect(calls.filter((c) => c.includes('prop=extracts')).length).toBe(2) // cached
    expect(calls.every((c) => c.includes('origin=*') || c.includes('origin=%2A'))).toBe(true)
  })
  it('retries on 429 then fails loudly on 4xx', async () => {
    let n = 0
    const fake = async () => (++n < 2 ? { ok: false, status: 429, json: async () => ({}) } : { ok: true, status: 200, json: async () => ({ query: { search: [] } }) })
    const w = new WikipediaSource({ fetch: fake })
    expect(await w.searchTitles('x', 1)).toEqual([])
    const bad = new WikipediaSource({ fetch: async () => ({ ok: false, status: 403, json: async () => ({}) }) })
    await expect(bad.searchTitles('y', 1)).rejects.toThrow('wikipedia 403')
  })
})

describe('pagesFor', () => {
  it('never uses disambiguation pages as evidence', async () => {
    const fake = async (u: string) => {
      const p = new URL(u).searchParams
      if (p.get('list') === 'search') return { ok: true, status: 200, json: async () => ({ query: { search: [{ title: 'Tour Eiffel (disambiguation)' }, { title: 'Eiffel Tower' }] } }) }
      return { ok: true, status: 200, json: async () => ({ query: { pages: [{ title: p.get('titles'), extract: 'Text here is long enough.' }] } }) }
    }
    const pages = await new WikipediaSource({ fetch: fake }).pagesFor({ claim: 'The Eiffel Tower is in Paris.', topic: 'Eiffel Tower' })
    expect(pages.map((x) => x.title)).toEqual(['Eiffel Tower'])
  })
})

describe('cleanExtract', () => {
  it('drops headings and everything from References on', () => {
    const x = 'Ada Lovelace was a mathematician.\n\nEarly life\nShe was born in London.\n\nReferences\nSmith, J. (2001).'
    expect(cleanExtract(x)).toBe('Ada Lovelace was a mathematician.\nShe was born in London.')
  })
})
