# E2 FActScore ChatGPT biographies — fact level — model DeBERTa-v3-base-mnli-fever-anli
Chosen on DEV — rule: Backed ≥85 % precision (no setting reached Contradicted ≥80 %); best balanced accuracy among 1155 of 1920 settings: gate {"minSimilarity":0.5,"minSharedTokens":2,"ignoreTopicTokens":false}, thresholds {"entail":0.6,"contradict":0.97,"contradictNeedsSubject":true,"entailNeedsSubject":false}

## DEV (used for choosing) — 1133 claims, 40 topics
- Balanced accuracy (human NS vs. our "needs checking" = contradicted or no receipt): 71.7%
- Human "not supported" caught: 410/475 = 86.3% [82.9%–89.1%] · human "supported" marked backed: 375/658 = 57.0% [53.2%–60.7%]
- When Receipts says **Backed**, humans agree: 375/440 = 85.2% [81.6%–88.2%]
- When Receipts says **Contradicted**, humans also say not supported: 72/117 = 61.5% [52.5%–69.9%]
- Share of ChatGPT facts supported (FActScore-style, mean over topics): human 54.6% · Receipts 37.8% · mean |difference| per biography 20.7%

(For reference, a hand-picked default {"minSimilarity":0.3,"minSharedTokens":1,"ignoreTopicTokens":false} {"entail":0.6,"contradict":0.7,"contradictNeedsSubject":false,"entailNeedsSubject":false} on DEV: balanced 65.9%)
