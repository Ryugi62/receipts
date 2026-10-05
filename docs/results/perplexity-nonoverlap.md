### PerplexityAI held-out, only the 5 people NOT in the ChatGPT test topics (small n) — 118 items, 5 topics, 25.4% not supported by humans

| System | Balanced accuracy [95 % CI] | Receipts minus this system (paired 95 % CI) | "Backed" → humans agree | Human-supported items it backs | False conflicts on human-supported | Skip (Backed) | Errors kept in the "check" pile | Random flagging, same amount | Errors named as "May conflict" | "May conflict" → not supported |
|---|---|---|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, as shipped) | 66.7% [44.8%–77.7%] | — | 89.8% (n=49) | 50.0% | 5.7% | 41.5% | 83.3% | 58.5% | 10.0% | 37.5% (n=8) |
| plain checker (top sentence + raw NLI label) | 62.1% [53.2%–72.3%] | 4.5 pts [-9.3, 8.0] | 87.8% (n=41) | 40.9% | 15.9% | 34.7% | 83.3% | 65.3% | 36.7% | 44.0% (n=25) |

"Errors kept in the check pile" = share of human-unsupported items that are not marked Backed. Flagging the same share of items at random would keep that share of errors (last column).
