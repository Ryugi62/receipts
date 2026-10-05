# E2 InstructGPT biographies, fact level, TEST topics — model nli-deberta-v3-xsmall
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
