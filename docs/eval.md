# How I evaluated Receipts

Public, human-labelled data; no training; every table below is produced by a script in `scripts/`, and per-item results
(evidence sentences and model scores) are in `docs/results/`. Wikipedia text used: release asset `wiki-cache.tar.gz` (v0.1).
"Plain checker" = the obvious baseline: take the most relevant sentence and the NLI model's raw label, no gate, no thresholds.

## The short version
- **Fresh held-out set (PerplexityAI biographies, 1,253 facts, never run before the settings were frozen):** balanced accuracy
  **70.7 %** vs 66.6 % for the plain checker; when Receipts says **Backed**, humans agree **94.1 %**; false "May conflict" on
  facts humans found true **3.6 %** vs **12.9 %** for the plain checker.
- **ChatGPT test topics (2,774 facts; seen once with v1, re-scored with v2 — labelled as such):** 72.4 % vs 67.1 %; false
  conflicts 3.5 % vs 11.9 %.
- **Unrelated sentences (Symmetric FEVER, 712 pairs):** the small model alone calls them a contradiction 74.3 % of the time;
  Receipts 0.3 %. Switching only the gate off brings it back to 48.2 %.
- **Misses, stated plainly:** on whole sentences from raw answers (the app's own splitter and topic guess) Receipts backs few
  sentences (balanced accuracy 57.1 %, tied with the plain checker); "May conflict" is only a hint (24–63 % precision depending
  on the set); v1 missed my 70 % target on its held-out run (68.0 %), which is why revision 2 exists.

## History and protocol
1. FActScore topics split by a hash of the name into dev (2/5) and test (3/5) before any result.
2. **v1** (SPEC §7): settings chosen on 40 ChatGPT dev topics, frozen, one test run → 68.0 %, a tie with the plain checker and
   worse on false conflicts (13.9 % vs 11.9 %). Reported below unchanged.
3. **v2** (SPEC §9, pushed to GitHub before running it): two decision options — a conflict may only come from the most relevant
   gated sentence; disagreeing sources may abstain — and a selection rule that requires beating the plain checker on false
   conflicts and conflict precision **on dev**. Then one run on a **fresh** set (PerplexityAI, 40 hash-chosen test topics).
4. Disclosure: Julia Faye, Carlos Santana and Marianne McAndrew are UI samples I looked at while building; each table is also
   shown without them. Post-freeze code changes (batching; skipping "(disambiguation)" pages; dropping pronunciation
   parentheses) were not tuned on any test data; the PerplexityAI and sentence-level runs used the final code.
5. The count "conflicts resting on a sentence about someone else" uses the gate's own subject rule, so it is circular for
   Receipts; it is kept in the tables for the baselines only and is not used as evidence.

## Revision 2 selection (dev)
Plain checker on dev: balanced 68.7%, Backed precision 88.3%, conflict precision 56.5% (n=200), false conflicts on supported 13.2%.
Rule met: all of (a)(b)(c); 3535 of 7680 settings qualify.
Chosen: gate {"minSimilarity":0.3,"minSharedTokens":0,"ignoreTopicTokens":false}, thresholds {"entail":0.7,"contradict":0.97,"contradictNeedsSubject":true,"entailNeedsSubject":false,"conflictFromTopOnly":true,"disagreement":"contradicted"}
Dev: balanced 73.2%, Backed precision 85.9%, conflict precision 59.7% (n=77), false conflicts on supported 4.7%.

## E-fresh — PerplexityAI biographies, 40 hash-chosen test topics (v2, single run)
Settings frozen on dev: gate {"minSimilarity":0.3,"minSharedTokens":0,"ignoreTopicTokens":false}, thresholds {"entail":0.7,"contradict":0.97,"contradictNeedsSubject":true,"entailNeedsSubject":false,"conflictFromTopOnly":true,"disagreement":"contradicted"}. Intervals: 95 % bootstrap over topics (1,000 resamples).

### All test topics — 1253 facts, 35 topics, 15.7% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, frozen on dev) | 70.7% [67.1%–74.1%] | 94.1% [91.4%–96.4%] (n=698) | 24.0% [9.5%–37.9%] (n=50) | 3.6% [2.4%–5.1%] | 4 | 44.3% | 53.7% (81.4%) |
| same thresholds, gate OFF | 70.3% [66.6%–73.7%] | 94.1% [91.4%–96.3%] (n=690) | 21.0% [9.4%–34.6%] (n=62) | 4.6% [3.5%–5.8%] | 18 | 44.9% | 53.1% (81.4%) |
| plain checker (top sentence + raw NLI label) | 66.6% [63.2%–70.0%] | 94.3% [91.2%–96.9%] (n=548) | 26.9% [15.6%–37.6%] (n=186) | 12.9% [10.6%–15.7%] | 43 | 56.3% | 42.2% (81.4%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (81.4%) |

### Without the topics used as UI samples during development (Julia Faye, Carlos Santana, Marianne McAndrew) — 1180 facts, 33 topics, 15.2% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, frozen on dev) | 69.9% [65.2%–73.2%] | 93.9% [91.1%–96.3%] (n=668) | 22.9% [9.6%–37.3%] (n=48) | 3.7% [2.5%–5.1%] | 4 | 43.4% | 54.5% (81.9%) |
| same thresholds, gate OFF | 69.5% [65.0%–72.9%] | 93.8% [91.0%–96.2%] (n=660) | 20.0% [8.2%–33.3%] (n=60) | 4.8% [3.7%–6.0%] | 18 | 44.1% | 54.0% (81.9%) |
| plain checker (top sentence + raw NLI label) | 65.8% [62.1%–69.5%] | 94.0% [91.2%–96.5%] (n=521) | 25.3% [13.7%–36.9%] (n=174) | 13.0% [10.5%–15.8%] | 40 | 55.8% | 42.6% (81.9%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (81.9%) |

### Stress test — evidence only from other pages (as if the subject had no article of their own) — 1253 facts, 35 topics, 15.7% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, frozen on dev) | 57.4% [54.5%–60.1%] | 93.2% [89.4%–96.7%] (n=278) | 31.6% [12.0%–50.0%] (n=19) | 1.2% [0.5%–2.0%] | 0 | 77.8% | 20.2% (81.4%) |
| same thresholds, gate OFF | 57.3% [54.3%–59.8%] | 93.1% [89.3%–96.6%] (n=274) | 27.8% [12.5%–44.4%] (n=54) | 3.7% [2.8%–4.8%] | 37 | 78.1% | 19.9% (81.4%) |
| plain checker (top sentence + raw NLI label) | 57.0% [54.4%–59.5%] | 93.6% [89.8%–97.1%] (n=249) | 24.2% [10.5%–38.1%] (n=124) | 8.9% [7.1%–10.9%] | 89 | 80.1% | 18.3% (81.4%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (81.4%) |

### Calibration (is a higher "backs" score more often right?)

| Highest "backs" score among gated sentences | Facts | Humans: supported |
|---|---|---|
| 0.0–0.2 | 437 | 69.3% |
| 0.2–0.4 | 48 | 81.3% |
| 0.4–0.6 | 38 | 71.1% |
| 0.6–0.8 | 36 | 88.9% |
| 0.8–0.9 | 44 | 88.6% |
| 0.9–1.0 | 650 | 94.8% |

## E2 — ChatGPT biographies, test topics
**v2 settings (re-scored; these topics were seen in the v1 run):**
Settings frozen on dev: gate {"minSimilarity":0.3,"minSharedTokens":0,"ignoreTopicTokens":false}, thresholds {"entail":0.7,"contradict":0.97,"contradictNeedsSubject":true,"entailNeedsSubject":false,"conflictFromTopOnly":true,"disagreement":"contradicted"}. Intervals: 95 % bootstrap over topics (1,000 resamples).

### All test topics — 2774 facts, 89 topics, 37.0% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, frozen on dev) | 72.4% [70.2%–74.5%] | 85.2% [80.9%–88.6%] (n=1307) | 58.8% [48.3%–69.9%] (n=148) | 3.5% [2.5%–4.4%] | 4 | 52.9% | 45.1% (60.1%) |
| same thresholds, gate OFF | 72.5% [70.2%–74.6%] | 85.4% [81.1%–88.9%] (n=1298) | 56.2% [46.5%–66.7%] (n=169) | 4.2% [3.1%–5.4%] | 31 | 53.2% | 44.8% (60.1%) |
| plain checker (top sentence + raw NLI label) | 67.1% [64.9%–68.8%] | 85.9% [80.8%–89.4%] (n=964) | 56.4% [49.8%–64.9%] (n=477) | 11.9% [10.1%–13.7%] | 107 | 65.2% | 33.3% (60.1%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (60.1%) |

### Without the topics used as UI samples during development (Julia Faye, Carlos Santana, Marianne McAndrew) — 2715 facts, 87 topics, 37.2% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, frozen on dev) | 72.5% [70.2%–74.6%] | 85.3% [80.5%–88.9%] (n=1271) | 59.2% [49.7%–70.9%] (n=147) | 3.5% [2.5%–4.4%] | 4 | 53.2% | 44.7% (59.9%) |
| same thresholds, gate OFF | 72.6% [70.2%–74.8%] | 85.5% [80.6%–89.1%] (n=1262) | 56.9% [47.6%–68.5%] (n=167) | 4.2% [3.1%–5.4%] | 30 | 53.5% | 44.4% (59.9%) |
| plain checker (top sentence + raw NLI label) | 67.2% [65.0%–69.0%] | 86.0% [80.5%–89.5%] (n=938) | 56.6% [50.7%–65.5%] (n=465) | 11.8% [9.9%–13.3%] | 105 | 65.5% | 33.0% (59.9%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (59.9%) |

### Stress test — evidence only from other pages (as if the subject had no article of their own) — 2774 facts, 89 topics, 37.0% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, frozen on dev) | 56.0% [54.0%–58.2%] | 77.8% [69.3%–84.6%] (n=519) | 51.3% [31.8%–70.3%] (n=39) | 1.1% [0.6%–1.6%] | 0 | 81.3% | 17.4% (60.1%) |
| same thresholds, gate OFF | 56.0% [54.0%–58.3%] | 78.1% [69.2%–85.2%] (n=515) | 49.6% [39.7%–61.1%] (n=117) | 3.4% [2.2%–4.4%] | 79 | 81.4% | 17.3% (60.1%) |
| plain checker (top sentence + raw NLI label) | 55.8% [54.0%–57.8%] | 80.0% [70.7%–86.6%] (n=444) | 51.0% [43.4%–60.3%] (n=304) | 8.5% [6.7%–10.3%] | 216 | 84.0% | 14.9% (60.1%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (60.1%) |

### Calibration (is a higher "backs" score more often right?)

| Highest "backs" score among gated sentences | Facts | Humans: supported |
|---|---|---|
| 0.0–0.2 | 1215 | 38.6% |
| 0.2–0.4 | 93 | 67.7% |
| 0.4–0.6 | 83 | 61.4% |
| 0.6–0.8 | 91 | 69.2% |
| 0.8–0.9 | 106 | 73.6% |
| 0.9–1.0 | 1186 | 86.3% |

**v1 settings (the original single held-out run):**
Settings frozen on dev: gate {"minSimilarity":0.4,"minSharedTokens":1,"ignoreTopicTokens":true}, thresholds {"entail":0.5,"contradict":0.97,"contradictNeedsSubject":true,"entailNeedsSubject":false}. Intervals: 95 % bootstrap over topics (1,000 resamples).

### All test topics — 2774 facts, 89 topics, 37.0% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (frozen dev settings) | 68.0% [65.4%–70.2%] | 83.7% [78.2%–87.8%] (n=1119) | 39.7% [32.7%–48.8%] (n=403) | 13.9% [11.0%–16.6%] | 10 | 59.7% | 38.2% (60.1%) |
| same thresholds, gate OFF | 66.8% [64.8%–68.8%] | 84.5% [79.6%–88.5%] (n=1011) | 43.1% [37.4%–49.9%] (n=938) | 30.6% [27.4%–33.5%] | 287 | 63.6% | 34.8% (60.1%) |
| plain checker (top sentence + raw NLI label) | 67.1% [64.9%–68.8%] | 85.9% [80.8%–89.4%] (n=964) | 56.4% [49.8%–64.9%] (n=477) | 11.9% [10.1%–13.7%] | 107 | 65.2% | 33.3% (60.1%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (60.1%) |

### Without the topics used as UI samples during development (Julia Faye, Carlos Santana, Marianne McAndrew) — 2715 facts, 87 topics, 37.2% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (frozen dev settings) | 68.0% [65.4%–70.3%] | 83.8% [77.6%–87.9%] (n=1087) | 39.7% [32.6%–48.9%] (n=395) | 14.0% [10.9%–16.7%] | 10 | 60.0% | 37.9% (59.9%) |
| same thresholds, gate OFF | 66.8% [64.8%–68.9%] | 84.5% [79.1%–88.4%] (n=983) | 43.0% [37.7%–50.5%] (n=918) | 30.7% [27.7%–33.5%] | 279 | 63.8% | 34.6% (59.9%) |
| plain checker (top sentence + raw NLI label) | 67.2% [65.0%–69.0%] | 86.0% [80.5%–89.5%] (n=938) | 56.6% [50.7%–65.5%] (n=465) | 11.8% [9.9%–13.3%] | 105 | 65.5% | 33.0% (59.9%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (59.9%) |

### Stress test — evidence only from other pages (as if the subject had no article of their own) — 2774 facts, 89 topics, 37.0% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (frozen dev settings) | 55.6% [53.4%–57.8%] | 76.9% [67.7%–84.4%] (n=520) | 38.5% [20.0%–63.0%] (n=26) | 0.9% [0.5%–1.3%] | 0 | 81.3% | 17.4% (60.1%) |
| same thresholds, gate OFF | 55.4% [53.7%–57.5%] | 77.6% [69.3%–84.7%] (n=474) | 48.8% [39.7%–57.5%] (n=283) | 8.3% [6.8%–10.0%] | 234 | 82.9% | 15.9% (60.1%) |
| plain checker (top sentence + raw NLI label) | 55.8% [54.0%–57.8%] | 80.0% [70.7%–86.6%] (n=444) | 51.0% [43.4%–60.3%] (n=304) | 8.5% [6.7%–10.3%] | 216 | 84.0% | 14.9% (60.1%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (60.1%) |

## E-full — the app's whole path on raw ChatGPT answers (sentence level, 40 hash-chosen test topics, v2)
Our splitter and topic guess, no hints. A sentence counts as "supported" only if every human atomic fact in it is supported, and
as "Backed" only if every part we split it into is backed — strict on both sides.
Settings frozen on dev: gate {"minSimilarity":0.3,"minSharedTokens":0,"ignoreTopicTokens":false}, thresholds {"entail":0.7,"contradict":0.97,"contradictNeedsSubject":true,"entailNeedsSubject":false,"conflictFromTopOnly":true,"disagreement":"contradicted"}. Intervals: 95 % bootstrap over topics (1,000 resamples).

### All test topics — 292 facts, 40 topics, 58.2% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, frozen on dev) | 57.1% [53.5%–60.9%] | 80.8% [65.5%–94.3%] (n=26) | 63.2% [44.4%–86.4%] (n=19) | 5.7% [1.9%–9.9%] | 0 | 91.1% | 8.5% (40.3%) |
| same thresholds, gate OFF | 57.1% [53.5%–60.9%] | 80.8% [65.5%–94.3%] (n=26) | 63.2% [41.7%–82.4%] (n=19) | 5.7% [2.5%–9.4%] | 2 | 91.1% | 8.5% (40.3%) |
| plain checker (top sentence + raw NLI label) | 56.9% [53.4%–60.7%] | 86.4% [73.9%–100.0%] (n=22) | 70.0% [54.2%–83.8%] (n=40) | 9.8% [5.3%–15.0%] | 5 | 92.5% | 7.2% (40.3%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (40.3%) |

### Without the topics used as UI samples during development (Julia Faye, Carlos Santana, Marianne McAndrew) — 279 facts, 38 topics, 58.1% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, frozen on dev) | 56.6% [53.0%–60.1%] | 79.2% [62.5%–93.8%] (n=24) | 63.2% [42.9%–86.7%] (n=19) | 6.0% [1.7%–10.8%] | 0 | 91.4% | 8.2% (40.5%) |
| same thresholds, gate OFF | 56.6% [53.0%–60.1%] | 79.2% [62.5%–93.8%] (n=24) | 63.2% [41.2%–83.3%] (n=19) | 6.0% [2.5%–9.8%] | 2 | 91.4% | 8.2% (40.5%) |
| plain checker (top sentence + raw NLI label) | 56.3% [53.1%–60.3%] | 85.0% [71.4%–100.0%] (n=20) | 67.6% [51.4%–82.9%] (n=37) | 10.3% [5.1%–15.6%] | 5 | 92.8% | 6.8% (40.5%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (40.5%) |

### Stress test — evidence only from other pages (as if the subject had no article of their own) — 292 facts, 40 topics, 58.2% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, frozen on dev) | 50.0% [50.0%–50.0%] | — | 100.0% [100.0%–100.0%] (n=3) | 0.0% [0.0%–0.0%] | 0 | 100.0% | 0.0% (40.3%) |
| same thresholds, gate OFF | 50.0% [50.0%–50.0%] | — | 77.8% [50.0%–100.0%] (n=9) | 1.6% [0.0%–4.4%] | 6 | 100.0% | 0.0% (40.3%) |
| plain checker (top sentence + raw NLI label) | 50.0% [50.0%–50.0%] | — | 70.6% [44.4%–92.3%] (n=17) | 4.1% [1.0%–7.9%] | 10 | 100.0% | 0.0% (40.3%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (40.3%) |

## E1 — Unrelated sentences (Symmetric FEVER v0.2, 712 test pairs, Schuster et al. 2019)
Each claim with its real evidence, and with another pair's evidence (a different subject). Same model outputs, four decision rules.
**nli-deberta-v3-xsmall (shipped)**

| Setting | Real evidence: correct | Coverage (not "no receipt") | Correct when decided | SUPPORTS → backed | REFUTES → conflict | Unrelated sentence → "no receipt" | Unrelated → "conflict" |
|---|---|---|---|---|---|---|---|
| Receipts as shipped (gate + web/config.json thresholds) | 388/712 = 54.5% [50.8%–58.1%] | 398/712 = 55.9% [52.2%–59.5%] | 388/398 = 97.5% [95.4%–98.6%] | 213/356 = 59.8% [54.7%–64.8%] | 175/356 = 49.2% [44.0%–54.3%] | 707/712 = 99.3% [98.4%–99.7%] | 2/712 = 0.3% [0.1%–1.0%] |
| shipped thresholds, gate OFF | 471/712 = 66.2% [62.6%–69.5%] | 492/712 = 69.1% [65.6%–72.4%] | 471/492 = 95.7% [93.6%–97.2%] | 215/356 = 60.4% [55.2%–65.3%] | 256/356 = 71.9% [67.0%–76.3%] | 366/712 = 51.4% [47.7%–55.1%] | 343/712 = 48.2% [44.5%–51.8%] |
| gate ON, plain 0.6/0.6 thresholds | 514/712 = 72.2% [68.8%–75.4%] | 564/712 = 79.2% [76.1%–82.0%] | 514/564 = 91.1% [88.5%–93.2%] | 215/356 = 60.4% [55.2%–65.3%] | 299/356 = 84.0% [79.8%–87.4%] | 705/712 = 99.0% [98.0%–99.5%] | 4/712 = 0.6% [0.2%–1.4%] |
| plain checker: raw NLI label, no gate | 538/712 = 75.6% [72.3%–78.6%] | 602/712 = 84.6% [81.7%–87.0%] | 538/602 = 89.4% [86.7%–91.6%] | 220/356 = 61.8% [56.6%–66.7%] | 318/356 = 89.3% [85.7%–92.1%] | 180/712 = 25.3% [22.2%–28.6%] | 529/712 = 74.3% [71.0%–77.4%] |

- Claim-only cue baseline (negation word → refutes): 356/712 = 50.0% [46.3%–53.7%] — the symmetric set is built so the claim alone carries no signal (a property of the data set, not of our model).
- "Unrelated" = the evidence sentence of the pair 356 rows away (a different subject). This is the easy case; hard, same-topic cases are measured in E2 on real labels (false conflicts on human-supported facts).
- Runtime: 23 s (batched inference, laptop CPU).

**DeBERTa-v3-base-mnli-fever-anli (larger, 244 MB vs 87 MB)**

| Setting | Real evidence: correct | Coverage (not "no receipt") | Correct when decided | SUPPORTS → backed | REFUTES → conflict | Unrelated sentence → "no receipt" | Unrelated → "conflict" |
|---|---|---|---|---|---|---|---|
| Receipts as shipped (gate + web/config.json thresholds) | 256/712 = 36.0% [32.5%–39.5%] | 283/712 = 39.7% [36.2%–43.4%] | 256/283 = 90.5% [86.5%–93.4%] | 243/356 = 68.3% [63.3%–72.9%] | 13/356 = 3.7% [2.1%–6.1%] | 708/712 = 99.4% [98.6%–99.8%] | 0/712 = 0.0% [0.0%–0.5%] |
| shipped thresholds, gate OFF | 264/712 = 37.1% [33.6%–40.7%] | 291/712 = 40.9% [37.3%–44.5%] | 264/291 = 90.7% [86.8%–93.5%] | 246/356 = 69.1% [64.1%–73.7%] | 18/356 = 5.1% [3.2%–7.9%] | 707/712 = 99.3% [98.4%–99.7%] | 1/712 = 0.1% [0.0%–0.8%] |
| gate ON, plain 0.6/0.6 thresholds | 426/712 = 59.8% [56.2%–63.4%] | 472/712 = 66.3% [62.7%–69.7%] | 426/472 = 90.3% [87.2%–92.6%] | 252/356 = 70.8% [65.9%–75.3%] | 174/356 = 48.9% [43.7%–54.1%] | 705/712 = 99.0% [98.0%–99.5%] | 3/712 = 0.4% [0.1%–1.2%] |
| plain checker: raw NLI label, no gate | 466/712 = 65.4% [61.9%–68.9%] | 533/712 = 74.9% [71.5%–77.9%] | 466/533 = 87.4% [84.3%–90.0%] | 266/356 = 74.7% [70.0%–79.0%] | 200/356 = 56.2% [51.0%–61.2%] | 637/712 = 89.5% [87.0%–91.5%] | 64/712 = 9.0% [7.1%–11.3%] |

- Claim-only cue baseline (negation word → refutes): 356/712 = 50.0% [46.3%–53.7%] — the symmetric set is built so the claim alone carries no signal (a property of the data set, not of our model).
- "Unrelated" = the evidence sentence of the pair 356 rows away (a different subject). This is the easy case; hard, same-topic cases are measured in E2 on real labels (false conflicts on human-supported facts).
- Runtime: 57 s (batched inference, laptop CPU).

## E3 — InstructGPT biographies (30 test topics in file order; seen in v1, re-scored with v2)
Settings frozen on dev: gate {"minSimilarity":0.3,"minSharedTokens":0,"ignoreTopicTokens":false}, thresholds {"entail":0.7,"contradict":0.97,"contradictNeedsSubject":true,"entailNeedsSubject":false,"conflictFromTopOnly":true,"disagreement":"contradicted"}. Intervals: 95 % bootstrap over topics (1,000 resamples).

### All test topics — 594 facts, 30 topics, 85.0% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, frozen on dev) | 74.1% [67.2%–83.0%] | 40.3% [25.0%–58.5%] (n=144) | 98.4% [94.4%–100.0%] (n=62) | 1.1% [0.0%–3.5%] | 4 | 75.8% | 22.9% (15.1%) |
| same thresholds, gate OFF | 74.3% [67.4%–83.2%] | 40.8% [25.5%–58.8%] (n=142) | 98.4% [94.4%–100.0%] (n=61) | 1.1% [0.0%–3.5%] | 14 | 76.1% | 22.7% (15.1%) |
| plain checker (top sentence + raw NLI label) | 71.4% [66.6%–77.5%] | 44.1% [27.6%–61.4%] (n=111) | 97.8% [94.4%–100.0%] (n=180) | 4.5% [0.0%–10.8%] | 52 | 81.3% | 18.2% (15.1%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (15.1%) |

### Without the topics used as UI samples during development (Julia Faye, Carlos Santana, Marianne McAndrew) — 594 facts, 30 topics, 85.0% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, frozen on dev) | 74.1% [67.2%–83.0%] | 40.3% [25.0%–58.5%] (n=144) | 98.4% [94.4%–100.0%] (n=62) | 1.1% [0.0%–3.5%] | 4 | 75.8% | 22.9% (15.1%) |
| same thresholds, gate OFF | 74.3% [67.4%–83.2%] | 40.8% [25.5%–58.8%] (n=142) | 98.4% [94.4%–100.0%] (n=61) | 1.1% [0.0%–3.5%] | 14 | 76.1% | 22.7% (15.1%) |
| plain checker (top sentence + raw NLI label) | 71.4% [66.6%–77.5%] | 44.1% [27.6%–61.4%] (n=111) | 97.8% [94.4%–100.0%] (n=180) | 4.5% [0.0%–10.8%] | 52 | 81.3% | 18.2% (15.1%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (15.1%) |

### Stress test — evidence only from other pages (as if the subject had no article of their own) — 594 facts, 30 topics, 85.0% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, frozen on dev) | 54.1% [49.4%–60.6%] | 21.7% [10.7%–40.8%] (n=92) | 90.0% [72.7%–100.0%] (n=20) | 2.2% [0.0%–6.3%] | 1 | 84.5% | 14.3% (15.1%) |
| same thresholds, gate OFF | 54.3% [49.7%–60.8%] | 22.2% [11.0%–41.3%] (n=90) | 97.7% [92.3%–100.0%] (n=43) | 1.1% [0.0%–4.1%] | 30 | 84.8% | 14.1% (15.1%) |
| plain checker (top sentence + raw NLI label) | 54.7% [50.9%–60.3%] | 24.7% [12.9%–42.6%] (n=73) | 93.8% [88.3%–98.1%] (n=144) | 10.1% [4.2%–20.0%] | 106 | 87.7% | 11.6% (15.1%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (15.1%) |

### Calibration (is a higher "backs" score more often right?)

| Highest "backs" score among gated sentences | Facts | Humans: supported |
|---|---|---|
| 0.0–0.2 | 420 | 6.0% |
| 0.2–0.4 | 11 | 18.2% |
| 0.4–0.6 | 9 | 22.2% |
| 0.6–0.8 | 13 | 23.1% |
| 0.8–0.9 | 11 | 9.1% |
| 0.9–1.0 | 130 | 43.1% |

## What I did not do
- No model training or fine-tuning; thresholds and gate settings are the only tuned numbers.
- No labels of my own: all labels come from the datasets' authors.
- No user study. The claims about students are a design goal, not a measured outcome.
