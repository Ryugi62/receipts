# E2 InstructGPT biographies, fact level, TEST topics — model nli-deberta-v3-xsmall
Settings frozen on dev: gate {"minSimilarity":0.4,"minSharedTokens":1,"ignoreTopicTokens":true}, thresholds {"entail":0.5,"contradict":0.97,"contradictNeedsSubject":true,"entailNeedsSubject":false}. Intervals: 95 % bootstrap over topics (1,000 resamples).

### All test topics — 594 facts, 30 topics, 85.0% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (frozen dev settings) | 68.6% [60.8%–78.3%] | 37.3% [21.2%–55.1%] (n=126) | 79.2% [69.0%–95.7%] (n=48) | 11.2% [1.7%–22.6%] | 2 | 78.8% | 19.9% (15.1%) |
| same thresholds, gate OFF | 72.5% [64.2%–82.5%] | 45.1% [28.3%–62.9%] (n=113) | 92.4% [87.4%–97.5%] (n=276) | 23.6% [8.7%–40.0%] | 123 | 81.0% | 17.7% (15.1%) |
| plain checker (top sentence + raw NLI label) | 71.4% [66.6%–77.5%] | 44.1% [27.6%–61.4%] (n=111) | 97.8% [94.4%–100.0%] (n=180) | 4.5% [0.0%–10.8%] | 52 | 81.3% | 18.2% (15.1%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (15.1%) |

### Without the topics used as UI samples during development (Julia Faye, Carlos Santana, Marianne McAndrew) — 594 facts, 30 topics, 85.0% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (frozen dev settings) | 68.6% [60.8%–78.3%] | 37.3% [21.2%–55.1%] (n=126) | 79.2% [69.0%–95.7%] (n=48) | 11.2% [1.7%–22.6%] | 2 | 78.8% | 19.9% (15.1%) |
| same thresholds, gate OFF | 72.5% [64.2%–82.5%] | 45.1% [28.3%–62.9%] (n=113) | 92.4% [87.4%–97.5%] (n=276) | 23.6% [8.7%–40.0%] | 123 | 81.0% | 17.7% (15.1%) |
| plain checker (top sentence + raw NLI label) | 71.4% [66.6%–77.5%] | 44.1% [27.6%–61.4%] (n=111) | 97.8% [94.4%–100.0%] (n=180) | 4.5% [0.0%–10.8%] | 52 | 81.3% | 18.2% (15.1%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (15.1%) |

### Stress test — evidence only from other pages (as if the subject had no article of their own) — 594 facts, 30 topics, 85.0% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (frozen dev settings) | 53.3% [48.8%–59.6%] | 20.7% [10.5%–38.1%] (n=87) | 66.7% [40.0%–100.0%] (n=9) | 3.4% [0.0%–10.0%] | 1 | 85.4% | 13.0% (15.1%) |
| same thresholds, gate OFF | 55.1% [51.0%–61.1%] | 25.3% [13.5%–43.4%] (n=75) | 93.8% [88.6%–98.3%] (n=146) | 10.1% [3.1%–23.3%] | 121 | 87.4% | 11.7% (15.1%) |
| plain checker (top sentence + raw NLI label) | 54.7% [50.9%–60.3%] | 24.7% [12.9%–42.6%] (n=73) | 93.8% [88.3%–98.1%] (n=144) | 10.1% [4.2%–20.0%] | 106 | 87.7% | 11.6% (15.1%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (15.1%) |
