// Evidence clean-up before inference (SPEC §11). Only what the model reads changes; the student always sees the original
// sentence. Pure, no I/O.

/** "Miguel Díaz (baseball)" → "Miguel Díaz": the name as it appears in running text. */
export function subjectName(topic: string): string {
  return topic.replace(/\s*\([^()]*\)\s*$/, '').trim() || topic
}

const MONTHS: Record<string, string> = {
  jan: 'January', feb: 'February', mar: 'March', apr: 'April', may: 'May', jun: 'June', jul: 'July', aug: 'August',
  sep: 'September', sept: 'September', oct: 'October', nov: 'November', dec: 'December',
}
const MONTH_RE = '(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)'

/** One date format for both sides: "August 29, 1993" / "Aug. 29, 1993" → "29 August 1993". */
export function normalizeDates(text: string): string {
  return text.replace(new RegExp(`\\b${MONTH_RE}\\.?\\s+(\\d{1,2}),\\s+(\\d{3,4})\\b`, 'g'), (_m, mon: string, d: string, y: string) =>
    `${d} ${MONTHS[mon.toLowerCase().slice(0, mon.toLowerCase() === 'sept' ? 4 : 3)] ?? mon} ${y}`)
}

// Letters outside Latin/Greek/common punctuation: CJK, Hangul, kana, Cyrillic, Arabic, Hebrew, Devanagari, Thai …
const NON_LATIN = /[Ѐ-ӿ֐-׿؀-ۿऀ-෿฀-๿ᄀ-ᇿ぀-ヿ㄰-㆏㐀-鿿가-힯]/
const GLOSS = /^\s*[A-Z][a-z]+(?: [A-Z][a-z]+)?:\s/

function cleanParentheses(s: string): string {
  return s.replace(/\s*\(([^()]*)\)/g, (whole, inner: string) => {
    const segs = inner.split(';').map((x) => x.trim()).filter(Boolean)
    const keep = segs.filter((seg) => !NON_LATIN.test(seg) && !GLOSS.test(seg) && !/^(?:romanized|lit\.|pronounced)\b/i.test(seg))
    if (keep.length === segs.length) return whole
    return keep.length ? ` (${keep.join('; ')})` : ''
  })
}

/**
 * What the inference model reads for one evidence sentence: a leading pronoun becomes the page's subject, native-script and
 * "Language:" parenthesis segments are dropped, dates are written one way.
 */
export function cleanForInference(sentence: string, pageTitle: string | null): string {
  let s = cleanParentheses(sentence)
  if (pageTitle) {
    const name = subjectName(pageTitle)
    s = s.replace(/^(He|She|They)\b/, name).replace(/^(His|Her|Their)\b/, `${name}'s`)
  }
  return normalizeDates(s).replace(/\s{2,}/g, ' ')
}
