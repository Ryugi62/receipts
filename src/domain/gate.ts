// Relevance gate: a sentence may decide a verdict only if it is about the same thing as the claim.
// Off-the-shelf NLI models label unrelated text as "contradiction" (measured in docs/eval.md), so this gate
// is what keeps an unrelated sentence from telling a student that a true claim is false. Pure, no I/O.

const STOPWORDS = new Set(
  ('a an the and or but if of in on at to for from by with as is are was were be been being has have had do does did ' +
    'he she it they them his her its their this that these those which who whom whose what when where why how ' +
    'not no nor so than too very can could will would shall should may might must also into about over after before ' +
    'between during under above up down out off again further then once there here all any both each few more most ' +
    'other some such only own same just one i you we me my your our us').split(' '),
)

export function contentTokens(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter((w) => !STOPWORDS.has(w) && (w.length > 2 || /\d/.test(w)))
}

export interface GateConfig {
  minSimilarity: number
  minSharedTokens: number
  /** Count only tokens that are not part of the topic name ("Marie Curie" is shared by every sentence on her page). */
  ignoreTopicTokens: boolean
}

export const DEFAULT_GATE: GateConfig = { minSimilarity: 0.35, minSharedTokens: 1, ignoreTopicTokens: false }

function stem(w: string): string {
  return w.replace(/(ies|es|s|ed|ing)$/, '')
}

export function sharedContentTokens(claim: string, sentence: string, ignore: string[] = []): number {
  const s = new Set(contentTokens(sentence).map(stem))
  const skip = new Set(ignore.flatMap((t) => contentTokens(t)).map(stem))
  return new Set(contentTokens(claim).map(stem).filter((w) => s.has(w) && !skip.has(w))).size
}

/** similarity = cosine similarity of sentence embeddings (or a lexical stand-in), in [−1, 1]. */
export function passesRelevanceGate(
  claim: string, sentence: string, similarity: number, cfg: GateConfig = DEFAULT_GATE, topic: string | null = null,
): boolean {
  const ignore = cfg.ignoreTopicTokens && topic ? [topic] : []
  return similarity >= cfg.minSimilarity && sharedContentTokens(claim, sentence, ignore) >= cfg.minSharedTokens
}

/**
 * Cheap lexical pre-filter before the embedding ranker: keep the n sentences sharing the most claim words
 * (ties keep page order). Keeps a 500-sentence article from costing 500 embeddings per claim.
 */
export function lexicalPrefilter<T extends { sentence: string }>(claim: string, candidates: T[], n: number): T[] {
  if (candidates.length <= n) return candidates
  const c = new Set(contentTokens(claim).map(stem))
  return candidates
    .map((x, i) => ({ x, i, k: new Set(contentTokens(x.sentence).map(stem).filter((w) => c.has(w))).size }))
    .sort((a, b) => b.k - a.k || a.i - b.i)
    .slice(0, n)
    .map((o) => o.x)
}

const KIN = /^(?:father|mother|husband|wife|son|daughter|brother|sister|parents|family|grandfather|grandmother|uncle|aunt|partner|ex-wife|ex-husband)\b/i

/** Does the sentence talk about the topic itself (a name token present, not only as "<Name>'s father")? */
export function mentionsSubject(sentence: string, topic: string | null): boolean {
  if (!topic) return true
  const all = topic.replace(/\(.*?\)/g, '').split(/\s+/).filter((w) => /^[A-Z]/.test(w) && w.length > 2 && !/^(The|Of|And)$/.test(w))
  // A first name alone is not the subject ("Julia Ward" is not "Julia Faye"): use the other name tokens when there are several.
  const names = all.length > 1 ? all.slice(1) : all
  for (const n of names) {
    const re = new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b('s|’s)?\\s*(\\S+)?`, 'g')
    for (const m of sentence.matchAll(re)) {
      if (m[1] && m[2] && KIN.test(m[2])) continue
      return true
    }
  }
  return false
}

/**
 * Is this evidence sentence about the claim's subject? Yes if it names the subject (not only "<Name>'s father"),
 * or if it sits on the subject's own page and starts with a pronoun that is not followed by a relative ("Her father …").
 */
export function aboutSubject(sentence: string, topic: string | null, pageTitle: string | null): boolean {
  if (!topic) return true
  if (mentionsSubject(sentence, topic)) return true
  if (!pageTitle || !mentionsSubject(pageTitle, topic)) return false
  const m = sentence.match(/^(He|She|They|It|His|Her|Their|Its)\s+(\S+)/)
  if (!m) return false
  return !(/^(His|Her|Their|Its)$/.test(m[1]) && KIN.test(m[2]))
}
