### E4 — the app's whole path on original FEVER claims beyond biographies (Symmetric FEVER dev+test originals, FEVER labels, shipped settings, run once) — 355 items, 355 topics, 58.6% not supported by humans

| System | Balanced accuracy [95 % CI] | Receipts minus this system (paired 95 % CI) | "Backed" → humans agree | Human-supported items it backs | False conflicts on human-supported | Skip (Backed) | Errors kept in the "check" pile | Random flagging, same amount | Errors named as "May conflict" | "May conflict" → not supported |
|---|---|---|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, as shipped) | 75.5% [70.6%–79.3%] | — | 89.1% (n=92) | 55.8% | 5.4% | 25.9% | 95.2% | 74.1% | 28.4% | 88.1% (n=67) |
| plain checker (top sentence + raw NLI label) | 68.4% [63.5%–72.0%] | 7.0 pts [4.6, 9.5] | 84.9% (n=73) | 42.2% | 18.4% | 20.6% | 94.7% | 79.4% | 70.7% | 84.5% (n=174) |

"Errors kept in the check pile" = share of human-unsupported items that are not marked Backed. Flagging the same share of items at random would keep that share of errors (last column).
