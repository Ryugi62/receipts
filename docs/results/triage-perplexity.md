### Triage view — fresh held-out PerplexityAI (v2 run; code before the v3 bug fixes) — 1253 items, 35 topics, 15.7% not supported by humans

| System | Balanced accuracy [95 % CI] | Δ vs Receipts (paired 95 % CI) | "Backed" → humans agree | Human-supported items it backs | False conflicts on human-supported | Skip (Backed) | Errors kept in the "check" pile | Random flagging, same amount |
|---|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, as shipped) | 70.7% [66.3%–74.0%] | — | 94.1% (n=698) | 62.2% | 3.6% | 55.7% | 79.2% | 44.3% |
| plain checker (top sentence + raw NLI label) | 66.6% [63.0%–69.8%] | -4.1 pts [-6.3, -2.1] | 94.3% (n=548) | 49.0% | 12.9% | 43.7% | 84.3% | 56.3% |

"Errors kept in the check pile" = share of human-unsupported items that are not marked Backed. Flagging the same share of items at random would keep that share of errors (last column).
