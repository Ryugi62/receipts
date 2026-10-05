# Receipts — SPEC (SDD, v0.1 2026-10-05)

## 0. One line
A student pastes an answer from any AI chatbot. Receipts splits it into claims, finds the Wikipedia sentences that could
back each claim, and a small language-inference model running in the browser marks every claim
**Backed / Contradicted / No receipt**, always showing the sentence it relied on. It is built to *read the evidence*,
not to guess from the claim — and the repo proves that on public, human-labelled data.

ML Empowerment Build Challenge 3.0 (Devpost) — "Build a project that addresses a real-world problem or contributes positive social impact."

## 1. Success conditions (numbers) · deadline (constant) · non-goals
- Deadline: Devpost header "Oct 9, 2026 @ 11:45pm PDT" (= 2026-10-10 15:45 KST, earlier than the rules page). Internal freeze 2026-10-09 20:00 KST.
- **E1 — reads the evidence (Symmetric FEVER v0.2 test, 712 pairs, Schuster et al. 2019):** report accuracy with the real evidence,
  and the verdict when the evidence is swapped for an unrelated sentence. Target: with the relevance gate, ≥ 90 % of swapped
  pairs end as *No receipt* (a naive NLI model calls unrelated text "contradiction" — measured, see docs/eval.md).
- **E2 — real chatbot answers (FActScore, Min et al. 2023, ChatGPT biographies, human atomic-fact labels S/NS):**
  run the full pipeline (retrieval from live Wikipedia + ranking + NLI + verdict) on held-out topics; report agreement with the
  human labels (balanced accuracy, precision of *Contradicted / No receipt* as "needs checking") with Wilson 95 % intervals,
  and the estimated vs. human factual precision of ChatGPT. Thresholds are chosen on a dev split of topics only.
  Target: balanced accuracy ≥ 0.70 on held-out topics; numbers are reported as they come out, misses listed.
- 0 network calls carry the pasted answer text: only search terms (claim text) go to Wikipedia (unit test on the adapter).
- Works with no account and no API key; first check < 60 s on a laptop including model download (measured, reported).
- Non-goals: no model training or fine-tuning (pretrained models only; thresholds are the only tuned numbers), no server,
  no storage of user text, no claim that Wikipedia is ground truth (UI says "Backed by Wikipedia", not "true").

## 2. Constraints
- 1 developer, 0 paid services. Models (ONNX via transformers.js, run in the browser and in Node for evaluation):
  NLI `Xenova/DeBERTa-v3-base-mnli-fever-anli` or smaller per E1/E2 measurement; sentence embeddings `Xenova/all-MiniLM-L6-v2`.
- Data licences: Symmetric FEVER (CC BY-SA 3.0, Wikipedia-derived), FActScore labelled data (MIT repo). Only small eval
  subsets are committed with attribution.
- Wikipedia access via the public MediaWiki Action API with `origin=*` (CORS), polite rate (≤ 5 req/s), User-Agent where allowed.

## 3. Ubiquitous language (identifiers match 1:1)
| Term | Meaning | Code |
|---|---|---|
| Answer | The pasted chatbot text | `Answer` |
| Claim | One checkable statement split from the answer | `Claim`, `splitClaims()` |
| Topic | The main entity the answer is about (used to resolve "he/she/it") | `Topic` |
| Source page | A Wikipedia article fetched as plain text | `SourcePage` |
| Evidence sentence | One sentence from a source page, with relevance score | `EvidenceSentence` |
| Relevance gate | Minimum relevance (embedding similarity + entity overlap) before a sentence may decide a verdict | `passesRelevanceGate()` |
| Inference | NLI probabilities (entail / contradict / neutral) for one claim–sentence pair | `Inference` |
| Verdict | `backed` / `contradicted` / `no_receipt` plus the receipt sentence | `Verdict`, `decideVerdict()` |
| Receipt | The evidence sentence (and link) that decided a verdict | `Receipt` |
| Swap test | Re-running a claim against an unrelated sentence to show the verdict becomes `no_receipt` | `swapTest()` |

## 4. Behaviour (Given / When / Then)
1. Given an answer with 3 sentences, one using "She", When split, Then 3+ claims and the pronoun is replaced by the topic.
2. Given inference entail 0.92 on a sentence that passes the gate, When deciding, Then `backed` with that sentence as receipt.
3. Given contradiction 0.95 but the sentence fails the relevance gate, When deciding, Then `no_receipt` (never `contradicted`).
4. Given contradiction ≥ τc on a gated sentence and no entailment ≥ τe, Then `contradicted` with the receipt.
5. Given both entail ≥ τe and contradict ≥ τc on different gated sentences, Then `backed` is not shown alone: verdict `contradicted`
   with both receipts listed ("sources disagree").
6. Given the Wikipedia adapter, When a claim is checked, Then the request URL contains only the claim/topic search terms, never the full answer.
7. Given the swap test on a backed claim, When run, Then the UI shows the new verdict next to the original.

## 5. Architecture (Clean)
`src/domain` (claims, gate, verdict — no I/O) ← `src/application` (checkAnswer use case, ports: EvidenceSource, Ranker, NliModel)
← `src/adapters` (wikipedia, transformers NLI, transformers embeddings, rule claim splitter) ← `web/` + `scripts/` (infrastructure).
`scripts/check-layers.mjs` fails on reverse imports.

## 6. UI acceptance (Toss-style checklist, measured by `scripts/capture.mjs`)
1. Mobile first: 390 px and 1280 px captures, horizontal overflow 0 (script fails otherwise).
2. One question per screen: one text box (+ optional topic) and one primary action.
3. Type: headline 30 px bold, body 16 px, secondary 13 px.
4. Spacing ≥ 24 px between sections, cards radius ≥ 16 px, no heavy shadows.
5. Fixed bottom CTA "Check the receipts", full width, 56 px.
6. Number first: the result starts with "N of M claims backed" (34 px).
7. Evidence folded: per-claim score table inside `<details>` (closed by default).
8. Microcopy: plain words ("No receipt — worth checking yourself"), no jargon without a one-line gloss.
9. Colour: white background, one brand blue (#3182F6) + three state colours, dark mode supported.
10. Dependencies: system fonts only; the only network calls are model files (Hugging Face, first visit) and Wikipedia.

## 7. Pre-registered selection (written before the final dev run, 2026-10-05)
- Settings per model: on dev only, keep settings whose "Backed" precision ≥ 85 % and "Contradicted" precision ≥ 80 % (≥ 20
  contradicted calls); pick the best balanced accuracy. If none qualifies, relax to Backed ≥ 85 % and say so.
- Model: ship the model whose chosen setting meets both floors; if both do, the smaller one unless the larger is ≥ 3 points
  better in balanced accuracy on dev. The held-out test run happens once, after this choice is committed.

## 8. Results against the targets (held-out, 2026-10-05 — details docs/eval.md)
- E1 swapped evidence → "no receipt" ≥ 90 %: **met** (shipped settings 710/712 = 99.7 %; conflicts on unrelated sentences 0/712).
- E2 balanced accuracy ≥ 0.70 on held-out topics: **missed** — 68.0 % [65.4–70.2] (2,774 facts, 89 topics); "Backed" precision 83.7 %.
- 0 network calls carry the pasted answer: met (unit test G/W/T 6). No key, no account: met. First check < 60 s with download:
  met (24 s on the live site, `scripts/smoke-live.mjs`).
