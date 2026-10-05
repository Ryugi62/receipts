# E2 ChatGPT biographies, sentence level, TEST topics — model nli-deberta-v3-xsmall
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
