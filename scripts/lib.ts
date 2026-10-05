// Shared helpers for evaluation scripts (infrastructure layer).
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/** fetch with an on-disk cache (data/raw/wiki-cache, git-ignored) so evaluation reruns hit the same Wikipedia text. */
export function cachedFetch(dir = 'data/raw/wiki-cache') {
  mkdirSync(dir, { recursive: true })
  let last = 0
  return async (url: string) => {
    const f = join(dir, createHash('sha1').update(url).digest('hex') + '.json')
    if (existsSync(f)) {
      const body = readFileSync(f, 'utf8')
      return { ok: true, status: 200, json: async () => JSON.parse(body) }
    }
    const wait = Math.max(0, last + 150 - Date.now()) // ≤ ~6 requests/s
    if (wait) await new Promise((r) => setTimeout(r, wait))
    last = Date.now()
    const r = await fetch(url, { headers: { 'User-Agent': 'ReceiptsEval/0.1 (student hackathon project; https://github.com/Ryugi62/receipts)' } })
    if (!r.ok) return { ok: false, status: r.status, json: async () => ({}) }
    const body = await r.text()
    writeFileSync(f, body)
    return { ok: true, status: 200, json: async () => JSON.parse(body) }
  }
}

/** Wilson 95 % interval for k successes out of n. */
export function wilson(k: number, n: number): [number, number] {
  if (!n) return [0, 0]
  const z = 1.96, p = k / n
  const d = 1 + (z * z) / n
  const c = p + (z * z) / (2 * n)
  const r = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))
  return [(c - r) / d, (c + r) / d]
}

export const pct = (x: number) => `${(100 * x).toFixed(1)}%`
export const ci = (k: number, n: number) => {
  const [a, b] = wilson(k, n)
  return `${k}/${n} = ${pct(k / Math.max(1, n))} [${pct(a)}–${pct(b)}]`
}

export const readJsonl = (p: string) => readFileSync(p, 'utf8').trim().split('\n').map((l) => JSON.parse(l))

/** Deterministic split by hashing a key (no peeking at labels). */
export const bucket = (key: string, mod: number) => parseInt(createHash('sha1').update(key).digest('hex').slice(0, 8), 16) % mod

export const arg = (name: string, def?: string) => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : def
}
