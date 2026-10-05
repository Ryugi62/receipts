# E2 ChatGPT biographies, fact level, TEST topics — model nli-deberta-v3-xsmall
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
