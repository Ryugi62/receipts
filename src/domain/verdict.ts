// Verdict: turn NLI probabilities over gated evidence sentences into backed / contradicted / no_receipt. Pure, no I/O.

export interface Inference {
  entail: number
  contradict: number
  neutral: number
}

export interface ScoredEvidence {
  sentence: string
  page: string
  url: string
  similarity: number
  passesGate: boolean
  inference: Inference
  /** The sentence is about the claim's subject (not only e.g. "<Name>'s father"). Missing = assumed true. */
  mentionsSubject?: boolean
}

export type VerdictLabel = 'backed' | 'contradicted' | 'no_receipt'

export interface Receipt {
  sentence: string
  page: string
  url: string
  entail: number
  contradict: number
}

export interface Verdict {
  label: VerdictLabel
  receipts: Receipt[]
  /** Gated sentences both entail and contradict the claim. */
  disagreement: boolean
  /** How many sentences passed the relevance gate. */
  gated: number
}

export interface Thresholds {
  entail: number
  contradict: number
  /** Only a sentence about the claim's subject may contradict it. */
  contradictNeedsSubject?: boolean
  /** Only a sentence about the claim's subject may back it. */
  entailNeedsSubject?: boolean
}

export const DEFAULT_THRESHOLDS: Thresholds = { entail: 0.6, contradict: 0.6 }

const toReceipt = (e: ScoredEvidence): Receipt => ({
  sentence: e.sentence, page: e.page, url: e.url, entail: e.inference.entail, contradict: e.inference.contradict,
})

export function decideVerdict(evidence: ScoredEvidence[], t: Thresholds = DEFAULT_THRESHOLDS): Verdict {
  const gated = evidence.filter((e) => e.passesGate)
  const best = (key: 'entail' | 'contradict') =>
    gated
      .filter((e) => e.inference[key] >= t[key])
      .filter((e) => e.mentionsSubject !== false || !(key === 'entail' ? t.entailNeedsSubject : t.contradictNeedsSubject))
      .sort((a, b) => b.inference[key] - a.inference[key])[0]
  const support = best('entail')
  const refute = best('contradict')
  if (support && refute) {
    return { label: 'contradicted', receipts: [toReceipt(refute), toReceipt(support)], disagreement: true, gated: gated.length }
  }
  if (refute) return { label: 'contradicted', receipts: [toReceipt(refute)], disagreement: false, gated: gated.length }
  if (support) return { label: 'backed', receipts: [toReceipt(support)], disagreement: false, gated: gated.length }
  return { label: 'no_receipt', receipts: [], disagreement: false, gated: gated.length }
}

/** A sentence verdict from its parts: any contradicted part → contradicted; all backed → backed; otherwise no_receipt. */
export function aggregateVerdicts(parts: Verdict[]): Verdict & { backedParts: number } {
  const backedParts = parts.filter((p) => p.label === 'backed').length
  const contra = parts.filter((p) => p.label === 'contradicted')
  const gated = parts.reduce((a, p) => a + p.gated, 0)
  if (contra.length) return { label: 'contradicted', receipts: contra.flatMap((p) => p.receipts), disagreement: contra.some((p) => p.disagreement), gated, backedParts }
  if (parts.length && backedParts === parts.length) return { label: 'backed', receipts: parts.flatMap((p) => p.receipts), disagreement: false, gated, backedParts }
  return { label: 'no_receipt', receipts: [], disagreement: false, gated, backedParts }
}
