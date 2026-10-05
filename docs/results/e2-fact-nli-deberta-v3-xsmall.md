# E2 FActScore ChatGPT biographies — fact level — model nli-deberta-v3-xsmall
Chosen on DEV — rule: Backed ≥85 % precision (no setting reached Contradicted ≥80 %); best balanced accuracy among 1591 of 1920 settings: gate {"minSimilarity":0.4,"minSharedTokens":1,"ignoreTopicTokens":true}, thresholds {"entail":0.5,"contradict":0.97,"contradictNeedsSubject":true,"entailNeedsSubject":false}

## DEV (used for choosing) — 1133 claims, 40 topics
- Balanced accuracy (human NS vs. our "needs checking" = contradicted or no receipt): 71.3%
- Human "not supported" caught: 421/475 = 88.6% [85.5%–91.2%] · human "supported" marked backed: 355/658 = 54.0% [50.1%–57.7%]
- When Receipts says **Backed**, humans agree: 355/409 = 86.8% [83.2%–89.7%]
- When Receipts says **Contradicted**, humans also say not supported: 81/153 = 52.9% [45.1%–60.7%]
- Share of ChatGPT facts supported (FActScore-style, mean over topics): human 54.6% · Receipts 35.0% · mean |difference| per biography 22.8%

(For reference, a hand-picked default {"minSimilarity":0.3,"minSharedTokens":1,"ignoreTopicTokens":false} {"entail":0.6,"contradict":0.7,"contradictNeedsSubject":false,"entailNeedsSubject":false} on DEV: balanced 62.6%)
