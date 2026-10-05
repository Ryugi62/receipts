# E2 FActScore ChatGPT biographies — fact level — model nli-deberta-v3-xsmall
Chosen on DEV — rule: Backed ≥85 % precision (no setting reached Contradicted ≥80 %); best balanced accuracy among 1366 of 1920 settings: gate {"minSimilarity":0.5,"minSharedTokens":1,"ignoreTopicTokens":true}, thresholds {"entail":0.5,"contradict":0.97,"contradictNeedsSubject":true,"entailNeedsSubject":false}

## DEV (used for choosing) — 437 claims, 16 topics
- Balanced accuracy (human NS vs. our "needs checking" = contradicted or no receipt): 69.2%
- Human "not supported" caught: 180/199 = 90.5% [85.6%–93.8%] · human "supported" marked backed: 114/238 = 47.9% [41.6%–54.2%]
- When Receipts says **Backed**, humans agree: 114/133 = 85.7% [78.8%–90.7%]
- When Receipts says **Contradicted**, humans also say not supported: 42/68 = 61.8% [49.9%–72.4%]
- Share of ChatGPT facts supported (FActScore-style, mean over topics): human 50.8% · Receipts 30.4% · mean |difference| per biography 23.9%

(For reference, a hand-picked default {"minSimilarity":0.3,"minSharedTokens":1,"ignoreTopicTokens":false} {"entail":0.6,"contradict":0.7,"contradictNeedsSubject":false,"entailNeedsSubject":false} on DEV: balanced 61.1%)
