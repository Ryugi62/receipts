# E2 ChatGPT biographies, fact level, TEST topics — model nli-deberta-v3-xsmall
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
