# Revision 3 selection on ChatGPT dev (1133 facts, 40 topics) — SPEC §11

| System (same retrieved sentences) | Balanced accuracy | "Backed" precision | "May conflict" precision | False conflicts on supported |
|---|---|---|---|---|
| plain checker (raw) | 68.5% | 87.4% (n=349) | 57.7% (n=208) | 13.4% |
| v2 settings, raw evidence | 73.1% | 85.7% (n=462) | 58.2% (n=79) | 5.0% |
| v2 settings, cleaned evidence | 73.8% | 86.0% (n=470) | 58.0% (n=81) | 5.2% |
| best cleaned setting under the rule | 73.8% | 86.0% (n=470) | 58.0% (n=81) | 5.2% |

Rule: all of (a)(b)(c); 2897 of 7680 settings qualify.
Best cleaned: gate {"minSimilarity":0.2,"minSharedTokens":0,"ignoreTopicTokens":false}, thresholds {"entail":0.7,"contradict":0.97,"contradictNeedsSubject":true,"entailNeedsSubject":false,"conflictFromTopOnly":true,"disagreement":"contradicted"}
Decision (ship v3 only if ≥ 1.0 point above v2 on raw evidence): **keep v2 settings (cleanEvidence off) + bug fixes** — 73.8% vs 73.1%.
