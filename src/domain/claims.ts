// Claims: split a chatbot answer into checkable statements. Pure functions, no I/O.

export interface Claim {
  /** Claim text as checked (pronoun at the start replaced by the topic). */
  text: string
  /** The sentence as written in the answer. */
  original: string
  topic: string | null
  index: number
  /** Atomic parts checked one by one (decomposeClaim); a simple sentence has one part equal to text. */
  parts: string[]
}

const ABBREVIATIONS = new Set([
  'dr', 'mr', 'mrs', 'ms', 'prof', 'sr', 'jr', 'st', 'mt', 'vs', 'etc', 'inc', 'ltd', 'co', 'corp', 'no', 'vol',
  'bros', 'ave', 'fig', 'approx', 'est', 'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec', 'gen', 'gov', 'sen', 'rep', 'col', 'lt',
  'u.s', 'u.k', 'e.g', 'i.e', 'a.m', 'p.m', 'ph.d',
])

/** Split text into sentences without breaking on abbreviations, initials ("J."), dotted acronyms or decimals. */
export function splitSentences(text: string): string[] {
  const t = text.replace(/\s+/g, ' ').trim()
  if (!t) return []
  const out: string[] = []
  let start = 0
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]
    if (ch !== '.' && ch !== '!' && ch !== '?') continue
    // Keep closing quotes/brackets with the sentence.
    let end = i + 1
    while (end < t.length && /["'”’)\]]/.test(t[end])) end++
    if (end < t.length && t[end] !== ' ') continue // e.g. 3.5, U.S.A
    const next = t.slice(end + 1, end + 2)
    if (end < t.length && next && !/[A-Z0-9"“'(\[]/.test(next)) continue // next word lower-case → not a boundary
    if (ch === '.') {
      const before = t.slice(start, i)
      const lastWord = (before.match(/([A-Za-z.]+)$/)?.[1] ?? '').toLowerCase()
      if (ABBREVIATIONS.has(lastWord) || ABBREVIATIONS.has(lastWord.replace(/\.$/, ''))) continue
      if (/(^|[\s.])[A-Z]$/.test(before)) continue // initial like "J."
      if (/(^|\s)([A-Za-z]\.){1,}[A-Za-z]$/.test(before)) {
        // dotted acronym such as "U.S" — a boundary only if the next word looks like a new sentence start (handled above)
        continue
      }
    }
    out.push(t.slice(start, end).trim())
    start = end + 1
  }
  if (start < t.length) out.push(t.slice(start).trim())
  return out.filter(Boolean)
}

/** Leading name before is/was/are/were/has/had, e.g. "Lanny Flaherty is …" → "Lanny Flaherty". */
export function guessTopic(firstSentence: string): string | null {
  const m = firstSentence.match(/^((?:The\s+)?(?:[A-Z][\p{L}'’.-]*\s*){1,6}?)(?:\s*\([^)]*\))?\s*,?\s+(?:is|was|are|were|has|had|became|served)\b/u)
  if (!m) return null
  return m[1].trim()
}

const BOILERPLATE = [
  /^as an ai\b/i, /\blanguage model\b/i, /^i (?:hope|think|believe|cannot|can't|don't|do not|am sorry|'m sorry)/i,
  /^(?:sure|certainly|of course|great question)[,!.]/i, /^(?:let me know|feel free|please note)/i,
  /^(?:overall|in summary|in conclusion),/i, /^(?:i'm|i am) (?:not|unable)/i,
]

function isClaimLike(s: string): boolean {
  if (s.endsWith('?')) return false
  if (s.endsWith('!') && s.split(' ').length < 6) return false
  if (BOILERPLATE.some((r) => r.test(s))) return false
  return s.split(/\s+/).length >= 3
}

const PRONOUN_SUBJECT = /^(He|She|They|It)\b/
const PRONOUN_POSSESSIVE = /^(His|Her|Their|Its)\b/

/** Replace a sentence-initial pronoun (He/She/They/It, His/Her/Their/Its) with the topic. */
export function resolvePronoun(text: string, topic: string | null): string {
  if (!topic) return text
  if (PRONOUN_SUBJECT.test(text)) return text.replace(PRONOUN_SUBJECT, topic)
  if (PRONOUN_POSSESSIVE.test(text)) return text.replace(PRONOUN_POSSESSIVE, `${topic}'s`)
  return text
}

/** Split an answer into claims (sentence-level), resolving a sentence-initial pronoun to the topic. */
export function splitClaims(answer: string, topicHint?: string): Claim[] {
  const sentences = splitSentences(answer)
  const topic = topicHint?.trim() || (sentences.length ? guessTopic(sentences[0]) : null)
  const claims: Claim[] = []
  for (const s of sentences) {
    if (!isClaimLike(s)) continue
    const text = resolvePronoun(s, topic)
    claims.push({ text, original: s, topic, index: claims.length, parts: decomposeClaim(text, topic) })
  }
  return claims
}

const VERB = '(?:is|was|are|were|has|had|have|became|began|won|wrote|made|took|gave|went|left|held|served|starred|appeared|worked|retired|released|received|founded|played|studied|moved|joined|died|married|graduated|earned|directed|produced|published|created|developed|led|returned|continued|remained|lived|taught|signed|scored|competed|represented|attended|is known|was known|became known|has been|had been)'
const VERB_RE = new RegExp(`\\s${VERB}\\b`)

/** Noun phrase before the main verb: "The Eiffel Tower was completed …" → "The Eiffel Tower". */
export function sentenceSubject(s: string): string | null {
  const m = s.replace(/\s*\([^)]*\)/g, '').match(new RegExp(`^(.{2,80}?)\\s${VERB}\\b`))
  if (!m) return null
  const subj = m[1].replace(/,$/, '').trim()
  return subj.includes(',') || subj.split(/\s+/).length > 7 ? null : subj
}

const MONTH_DATE = '(?:[A-Z][a-z]+\\.? \\d{1,2}, \\d{3,4}|\\d{1,2} [A-Z][a-z]+ \\d{3,4}|\\d{3,4})'
const ensureDot = (x: string) => (/[.!?]["”']?$/.test(x) ? x : `${x}.`)

/**
 * Break one sentence into atomic parts with simple, predictable rules (no model):
 * birth–death parentheses, "X was a Y who Z" relative clauses, and ", and <verb>" coordination with an implied subject.
 * Anything the rules do not recognise stays as one part.
 */
export function decomposeClaim(sentence: string, topic: string | null): string[] {
  let s = sentence.trim()
  const extra: string[] = []
  const subj0 = sentenceSubject(s)
  const subject = topic && subj0 && (subj0.includes(topic) || topic.includes(subj0) || /^(He|She|They|It)$/.test(subj0)) ? topic : subj0 ?? topic
  // 1. (born DATE – DATE) / (DATE – DATE)
  const life = s.match(new RegExp(`\\s*\\((?:born\\s+)?(${MONTH_DATE})\\s*[–-]\\s*(${MONTH_DATE})\\)`))
  if (life && subject) {
    s = s.replace(life[0], '')
    extra.push(`${subject} was born on ${life[1]}.`, `${subject} died on ${life[2]}.`)
  } else {
    const born = s.match(new RegExp(`\\s*\\(born\\s+(?:on\\s+)?(${MONTH_DATE})(?:\\s+in\\s+([^)]+))?\\)`))
    if (born && subject) {
      s = s.replace(born[0], '')
      extra.push(`${subject} was born on ${born[1]}${born[2] ? ` in ${born[2]}` : ''}.`)
    }
  }
  const parts: string[] = []
  // 2. "<subj> was/is a(n) <noun phrase> who|which <verb phrase>"
  const rel = s.match(/^(.+?\s(?:is|was|are|were)\s(?:an?|the)\s[^,]+?)\s(?:who|which)\s(.+)$/)
  let rest = s
  if (rel && subject) {
    parts.push(ensureDot(rel[1]))
    rest = `${subject} ${rel[2]}`
  }
  // 3. ", and <verb> …" or ", and he/she <verb> …" with the subject carried over
  const coord = rest.split(new RegExp(`,\\s+and\\s+(?=(?:(?:he|she|they|it)\\s+)?${VERB}\\b)`, 'i'))
  if (coord.length > 1 && subject) {
    parts.push(ensureDot(coord[0].replace(/[.,]$/, '')))
    for (const c of coord.slice(1)) {
      const pronoun = /^(?:he|she|they|it)\s+/i.test(c)
      parts.push(ensureDot(`${pronoun && topic ? topic : subject} ${c.replace(/^(?:he|she|they|it)\s+/i, '')}`))
    }
  } else parts.push(ensureDot(rest))
  return [...parts.map((p) => p.replace(/\s+/g, ' ').replace(/\s+([.,])/g, '$1')), ...extra]
}
