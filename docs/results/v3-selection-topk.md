# Revision 3 selection on ChatGPT dev (1133 facts, 40 topics) — SPEC §11

| System (same retrieved sentences) | Balanced accuracy | "Backed" precision | "May conflict" precision | False conflicts on supported |
|---|---|---|---|---|
| plain checker (raw) | 69.2% | 88.3% (n=350) | 59.1% (n=208) | 12.9% |
| v2 settings, raw evidence | 73.0% | 85.5% (n=462) | 59.5% (n=84) | 5.2% |
| v2 settings, cleaned evidence | 73.5% | 85.6% (n=471) | 54.9% (n=82) | 5.6% |
| best under the rule (top 5, cleaned) | 73.5% | 85.7% (n=469) | 67.1% (n=70) | 3.5% |

| Arm (best setting) | Balanced | Backed precision | Conflict precision | False conflicts | Settings qualifying |
|---|---|---|---|---|---|
| top 5, raw | 73.0% | 85.5% (n=462) | 59.5% (n=84) | 5.2% | 2950 |
| top 5, cleaned | 73.5% | 85.7% (n=469) | 67.1% (n=70) | 3.5% | 2573 |
| top 8, raw | 73.1% | 85.7% (n=461) | 64.5% (n=76) | 4.1% | 2082 |
| top 8, cleaned | 73.2% | 85.5% (n=468) | 60.3% (n=68) | 4.1% | 1634 |
| top 10, raw | 73.0% | 85.1% (n=469) | 65.3% (n=72) | 3.8% | 1538 |
| top 10, cleaned | 72.5% | 85.2% (n=458) | 64.7% (n=68) | 3.6% | 1032 |

Rule: all of (a)(b)(c); 11809 settings qualify across arms.
Best: top 5, cleaned evidence, gate {"minSimilarity":0.2,"minSharedTokens":0,"ignoreTopicTokens":false}, thresholds {"entail":0.7,"contradict":0.9,"contradictNeedsSubject":true,"entailNeedsSubject":false,"conflictFromTopOnly":true,"disagreement":"no_receipt"}
Decision (ship only if ≥ 1.0 point above v2, top 5, raw evidence): **keep v2 settings (top 5, cleanEvidence off) + bug fixes** — 73.5% vs 73.0%.
