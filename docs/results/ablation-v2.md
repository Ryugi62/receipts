# Revision 2 — component ablation

### Fresh held-out: PerplexityAI test topics — 1253 facts, 35 topics

| System | Balanced accuracy | Δ vs plain checker (paired 95 % CI) | False conflicts on human-supported facts | Unsupported facts caught as "May conflict" |
|---|---|---|---|---|
| Receipts v2 (all components) | 70.7% | 4.1 pts [1.9, 6.4] | 3.6% | 6.1% |
| − similarity gate | 70.7% | 4.1 pts [1.9, 6.4] | 3.6% | 6.1% |
| − subject rule | 70.3% | 3.7 pts [1.5, 6.2] | 4.6% | 6.6% |
| − conflict only from the top sentence | 66.7% | 0.0 pts [-2.8, 2.5] | 23.2% | 31.0% |
| − strict thresholds (0.6 / 0.6) | 70.6% | 4.0 pts [1.5, 6.6] | 5.3% | 8.6% |
| plain checker | 66.6% | — | 12.9% | 25.4% |

### ChatGPT test topics (seen in v1) — 2774 facts, 89 topics

| System | Balanced accuracy | Δ vs plain checker (paired 95 % CI) | False conflicts on human-supported facts | Unsupported facts caught as "May conflict" |
|---|---|---|---|---|
| Receipts v2 (all components) | 72.4% | 5.3 pts [4.0, 6.7] | 3.5% | 8.5% |
| − similarity gate | 72.3% | 5.2 pts [4.0, 6.6] | 3.5% | 8.6% |
| − subject rule | 72.6% | 5.5 pts [4.2, 6.9] | 4.2% | 9.2% |
| − conflict only from the top sentence | 68.0% | 0.9 pts [-0.5, 2.6] | 23.1% | 29.0% |
| − strict thresholds (0.6 / 0.6) | 72.1% | 5.0 pts [3.7, 6.5] | 5.4% | 12.4% |
| plain checker | 67.1% | — | 11.9% | 26.2% |

Reading: most of the gain on real answers comes from the asymmetric decision rule (support may come from any of the top five sentences, a conflict only from the single most relevant one, above 0.97). The similarity gate matters mainly when the evidence is about something else (E1, stress test). The price: few real errors are caught as "May conflict".
