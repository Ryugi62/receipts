# E2 FActScore ChatGPT biographies — fact level — model DeBERTa-v3-base-mnli-fever-anli
Chosen on DEV — rule: Backed ≥85 % and Contradicted ≥80 % precision; best balanced accuracy among 95 of 1920 settings: gate {"minSimilarity":0.5,"minSharedTokens":0,"ignoreTopicTokens":false}, thresholds {"entail":0.9,"contradict":0.97,"contradictNeedsSubject":true,"entailNeedsSubject":true}

## DEV (used for choosing) — 189 claims, 9 topics
- Balanced accuracy (human NS vs. our "needs checking" = contradicted or no receipt): 71.9%
- Human "not supported" caught: 115/119 = 96.6% [91.7%–98.7%] · human "supported" marked backed: 33/70 = 47.1% [35.9%–58.7%]
- When Receipts says **Backed**, humans agree: 33/37 = 89.2% [75.3%–95.7%]
- When Receipts says **Contradicted**, humans also say not supported: 35/43 = 81.4% [67.4%–90.3%]
- Share of ChatGPT facts supported (FActScore-style, mean over topics): human 39.0% · Receipts 22.5% · mean |difference| per biography 19.5%

(For reference, a hand-picked default {"minSimilarity":0.3,"minSharedTokens":1,"ignoreTopicTokens":false} {"entail":0.6,"contradict":0.7,"contradictNeedsSubject":false,"entailNeedsSubject":false} on DEV: balanced 67.0%)
