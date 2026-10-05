### Triage view — ChatGPT test topics (seen in v1; code before the v3 bug fixes) — 2774 items, 89 topics, 37.0% not supported by humans

| System | Balanced accuracy [95 % CI] | Receipts minus this system (paired 95 % CI) | "Backed" → humans agree | Human-supported items it backs | False conflicts on human-supported | Skip (Backed) | Errors kept in the "check" pile | Random flagging, same amount | Errors named as "May conflict" | "May conflict" → not supported |
|---|---|---|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, as shipped) | 72.4% [70.2%–74.4%] | — | 85.2% (n=1307) | 63.7% | 3.5% | 47.1% | 81.1% | 52.9% | 8.5% | 58.8% (n=148) |
| plain checker (top sentence + raw NLI label) | 67.1% [64.9%–68.8%] | 5.3 pts [4.1, 6.7] | 85.9% (n=964) | 47.4% | 11.9% | 34.8% | 86.8% | 65.2% | 26.2% | 56.4% (n=477) |

"Errors kept in the check pile" = share of human-unsupported items that are not marked Backed. Flagging the same share of items at random would keep that share of errors (last column).
