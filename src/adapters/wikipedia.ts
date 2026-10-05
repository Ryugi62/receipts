// Adapter: Wikipedia (MediaWiki Action API, CORS via origin=*) as an EvidenceSource.
import type { EvidenceSource, SourcePage } from '../application/checkAnswer'

type FetchLike = (url: string, init?: { headers?: Record<string, string>; signal?: AbortSignal }) => Promise<{ ok: boolean; status: number; json(): Promise<any> }>

export interface WikipediaOptions {
  lang?: string
  /** Pages found by searching the claim text, in addition to the topic page. */
  searchPages?: number
  maxCharsPerPage?: number
  fetch?: FetchLike
}

const END_SECTIONS = /^(See also|References|Notes|Citations|Sources|Further reading|External links|Bibliography|Notes and references|Footnotes)\s*$/i

/** Keep prose only: stop at the reference sections and drop heading lines (no sentence punctuation). */
export function cleanExtract(extract: string): string {
  const keep: string[] = []
  for (const raw of extract.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    if (END_SECTIONS.test(line)) break
    if (!/[.!?]["')\]]?$/.test(line) && line.split(/\s+/).length < 8) continue // section heading
    keep.push(line)
  }
  return keep.join('\n')
}

export class WikipediaSource implements EvidenceSource {
  private cache = new Map<string, Promise<SourcePage | null>>()
  private titleCache = new Map<string, Promise<string[]>>()
  private readonly api: string
  private readonly f: FetchLike
  constructor(private readonly opts: WikipediaOptions = {}) {
    this.api = `https://${opts.lang ?? 'en'}.wikipedia.org/w/api.php`
    this.f = opts.fetch ?? ((u, i) => fetch(u, i as RequestInit) as any)
  }

  url(params: Record<string, string>): string {
    const q = new URLSearchParams({ format: 'json', formatversion: '2', origin: '*', ...params })
    return `${this.api}?${q.toString()}`
  }

  private async get(params: Record<string, string>): Promise<any> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const r = await this.f(this.url(params))
      if (r.ok) return r.json()
      if (r.status !== 429 && r.status < 500) throw new Error(`wikipedia ${r.status}`)
      await new Promise((res) => setTimeout(res, 800 * (attempt + 1)))
    }
    throw new Error('wikipedia unavailable')
  }

  async searchTitles(text: string, limit: number): Promise<string[]> {
    const key = `${limit}|${text}`
    if (!this.titleCache.has(key)) {
      this.titleCache.set(key, this.get({ action: 'query', list: 'search', srsearch: text.slice(0, 280), srlimit: String(limit), srprop: '' })
        .then((d) => (d?.query?.search ?? []).map((x: any) => String(x.title))))
    }
    return this.titleCache.get(key)!
  }

  page(title: string): Promise<SourcePage | null> {
    if (!this.cache.has(title)) {
      this.cache.set(title, this.get({ action: 'query', prop: 'extracts', explaintext: '1', exsectionformat: 'plain', redirects: '1', titles: title })
        .then((d) => {
          const p = d?.query?.pages?.[0]
          if (!p || p.missing || !p.extract) return null
          const text = cleanExtract(String(p.extract)).slice(0, this.opts.maxCharsPerPage ?? 60000)
          return { title: p.title, url: `https://${this.opts.lang ?? 'en'}.wikipedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`, text }
        }))
    }
    return this.cache.get(title)!
  }

  async pagesFor(query: { claim: string; topic: string | null }): Promise<SourcePage[]> {
    const titles: string[] = []
    if (query.topic) titles.push(...(await this.searchTitles(query.topic, 1)))
    titles.push(...(await this.searchTitles(query.claim, this.opts.searchPages ?? 2)))
    const unique = [...new Set(titles)].slice(0, 3)
    const pages = await Promise.all(unique.map((t) => this.page(t)))
    return pages.filter((p): p is SourcePage => !!p)
  }
}
