// Use case: check a chatbot answer claim by claim. Depends only on domain + ports.
import { splitClaims, splitSentences, type Claim } from '../domain/claims'
import { cleanForInference, normalizeDates } from '../domain/evidence'
import { passesRelevanceGate, lexicalPrefilter, aboutSubject, DEFAULT_GATE, type GateConfig } from '../domain/gate'
import { decideVerdict, aggregateVerdicts, DEFAULT_THRESHOLDS, type Inference, type ScoredEvidence, type Thresholds, type Verdict } from '../domain/verdict'

export interface SourcePage {
  title: string
  url: string
  text: string
}

/** Finds candidate source pages for a claim. Receives only search terms, never the whole answer. */
export interface EvidenceSource {
  pagesFor(query: { claim: string; topic: string | null }): Promise<SourcePage[]>
}

/** Scores how related each sentence is to the claim (cosine similarity in [−1, 1]). */
export interface Ranker {
  similarities(claim: string, sentences: string[]): Promise<number[]>
}

/** NLI: premise = evidence sentence, hypothesis = claim. */
export interface NliModel {
  infer(pairs: { premise: string; hypothesis: string }[]): Promise<Inference[]>
}

export interface CheckOptions {
  topK: number
  /** Sentences kept by the lexical pre-filter before embedding ranking. */
  prefilter?: number
  gate: GateConfig
  thresholds: Thresholds
  topicHint?: string
  /** SPEC §11: the model reads cleaned evidence (pronoun → page subject, native-script glosses dropped, one date format). */
  cleanEvidence?: boolean
}

export const DEFAULT_OPTIONS: CheckOptions = { topK: 5, gate: DEFAULT_GATE, thresholds: DEFAULT_THRESHOLDS }

export interface PartResult {
  text: string
  verdict: Verdict
  evidence: ScoredEvidence[]
}

export interface ClaimResult {
  claim: Claim
  /** Aggregate over parts. */
  verdict: Verdict & { backedParts: number }
  parts: PartResult[]
}

export interface Deps {
  source: EvidenceSource
  ranker: Ranker
  nli: NliModel
}

/** Score a claim against given candidate sentences (used by checkClaim and by the swap test). */
export async function scoreEvidence(
  claimText: string,
  candidates: { sentence: string; page: string; url: string }[],
  deps: Pick<Deps, 'ranker' | 'nli'>,
  opts: CheckOptions = DEFAULT_OPTIONS,
  topic: string | null = null,
): Promise<ScoredEvidence[]> {
  candidates = lexicalPrefilter(claimText, candidates, opts.prefilter ?? 40)
  if (!candidates.length) return []
  const sims = await deps.ranker.similarities(claimText, candidates.map((c) => c.sentence))
  const top = candidates
    .map((c, i) => ({ ...c, similarity: sims[i] }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, opts.topK)
  const inf = await deps.nli.infer(top.map((c) => (opts.cleanEvidence
    ? { premise: cleanForInference(c.sentence, c.page), hypothesis: normalizeDates(claimText) }
    : { premise: c.sentence, hypothesis: claimText })))
  return top.map((c, i) => ({
    ...c,
    passesGate: passesRelevanceGate(claimText, c.sentence, c.similarity, opts.gate, topic),
    mentionsSubject: aboutSubject(c.sentence, topic, c.page),
    inference: inf[i],
  }))
}

export async function checkPart(text: string, topic: string | null, deps: Deps, opts: CheckOptions = DEFAULT_OPTIONS): Promise<PartResult> {
  const pages = await deps.source.pagesFor({ claim: text, topic })
  const candidates = pages.flatMap((p) =>
    splitSentences(p.text)
      .filter((s) => s.split(/\s+/).length >= 4)
      .map((sentence) => ({ sentence, page: p.title, url: p.url })),
  )
  const evidence = await scoreEvidence(text, candidates, deps, opts, topic)
  return { text, verdict: decideVerdict(evidence, opts.thresholds), evidence }
}

export async function checkClaim(claim: Claim, deps: Deps, opts: CheckOptions = DEFAULT_OPTIONS): Promise<ClaimResult> {
  const parts: PartResult[] = []
  for (const text of claim.parts) parts.push(await checkPart(text, claim.topic, deps, opts))
  return { claim, verdict: aggregateVerdicts(parts.map((p) => p.verdict)), parts }
}

export async function checkAnswer(
  answer: string,
  deps: Deps,
  opts: CheckOptions = DEFAULT_OPTIONS,
  onResult?: (r: ClaimResult) => void,
): Promise<ClaimResult[]> {
  const claims = splitClaims(answer, opts.topicHint)
  const results: ClaimResult[] = []
  for (const c of claims) {
    const r = await checkClaim(c, deps, opts)
    results.push(r)
    onResult?.(r)
  }
  return results
}

/** Swap test: re-run the claim against one unrelated sentence. A model that reads the evidence must answer no_receipt. */
export async function swapTest(
  claimText: string,
  unrelated: { sentence: string; page: string; url: string },
  deps: Pick<Deps, 'ranker' | 'nli'>,
  opts: CheckOptions = DEFAULT_OPTIONS,
): Promise<Verdict> {
  const ev = await scoreEvidence(claimText, [unrelated], deps, { ...opts, topK: 1 })
  return decideVerdict(ev, opts.thresholds)
}
