# E2 FActScore ChatGPT biographies — fact level — model nli-deberta-v3-xsmall
Chosen on DEV (best balanced accuracy of 1920 settings): gate {"minSimilarity":0.5,"minSharedTokens":2,"ignoreTopicTokens":false}, thresholds {"entail":0.7,"contradict":0.97,"contradictNeedsSubject":false,"entailNeedsSubject":false}

## DEV (used for choosing) — 111 claims, 5 topics
- Balanced accuracy (human NS vs. our "needs checking" = contradicted or no receipt): 74.3%
- Human "not supported" caught: 70/71 = 98.6% [92.4%–99.8%] · human "supported" marked backed: 20/40 = 50.0% [35.2%–64.8%]
- When Receipts says **Backed**, humans agree: 20/21 = 95.2% [77.3%–99.2%]
- When Receipts says **Contradicted**, humans also say not supported: 22/29 = 75.9% [57.9%–87.8%]
- Share of ChatGPT facts supported (FActScore-style, mean over topics): human 35.4% · Receipts 19.4% · mean |difference| per biography 16.0%

(For reference, a hand-picked default {"minSimilarity":0.3,"minSharedTokens":1,"ignoreTopicTokens":false} {"entail":0.6,"contradict":0.7,"contradictNeedsSubject":true,"entailNeedsSubject":false} on DEV: balanced 61.6%)
