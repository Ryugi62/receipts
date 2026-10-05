# E2 ChatGPT biographies, fact level, DEV topics — model nli-deberta-v3-xsmall
Settings frozen on dev: gate {"minSimilarity":0.4,"minSharedTokens":1,"ignoreTopicTokens":true}, thresholds {"entail":0.5,"contradict":0.97,"contradictNeedsSubject":true,"entailNeedsSubject":false}. Intervals: 95 % bootstrap over topics (1,000 resamples).

### All held-out topics — 1133 facts, 40 topics, 41.9% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Share flagged | Est. ChatGPT supported (human) |
|---|---|---|---|---|---|---|
| Receipts (frozen dev settings) | 71.3% [68.4%–74.0%] | 86.8% [81.2%–91.1%] (n=409) | 52.9% [41.3%–66.0%] (n=153) | 10.9% [8.2%–14.1%] | 63.9% | 35.0% (54.6%) |
| same thresholds, gate OFF | 67.8% [65.3%–70.5%] | 85.3% [78.9%–90.2%] (n=361) | 48.9% [39.9%–59.4%] (n=401) | 31.2% [27.1%–35.6%] | 68.1% | 30.5% (54.6%) |
| plain checker (top sentence + raw NLI label) | 68.7% [66.0%–71.4%] | 88.3% [82.5%–92.5%] (n=342) | 56.5% [43.7%–68.7%] (n=200) | 13.2% [10.5%–15.8%] | 69.8% | 29.9% (54.6%) |
| flag everything | 50.0% | — | — | 0.0% | 100.0% | 0.0% (54.6%) |

### Without the topics used as UI samples during development (Julia Faye, Carlos Santana, Marianne McAndrew) — 1113 facts, 39 topics, 41.7% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Share flagged | Est. ChatGPT supported (human) |
|---|---|---|---|---|---|---|
| Receipts (frozen dev settings) | 71.8% [69.4%–74.6%] | 87.8% [82.2%–92.2%] (n=400) | 53.3% [39.5%–65.5%] (n=152) | 10.9% [8.2%–14.0%] | 64.1% | 34.8% (54.8%) |
| same thresholds, gate OFF | 67.8% [65.1%–70.4%] | 85.4% [78.8%–90.5%] (n=356) | 48.2% [38.5%–58.5%] (n=392) | 31.3% [27.1%–35.7%] | 68.0% | 30.7% (54.8%) |
| plain checker (top sentence + raw NLI label) | 69.0% [66.4%–71.7%] | 89.0% [83.5%–93.1%] (n=335) | 56.1% [42.9%–68.0%] (n=198) | 13.4% [10.8%–15.9%] | 69.9% | 29.7% (54.8%) |
| flag everything | 50.0% | — | — | 0.0% | 100.0% | 0.0% (54.8%) |
