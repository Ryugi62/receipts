# E2 PerplexityAI biographies, fact level, TEST topics — model nli-deberta-v3-xsmall
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
