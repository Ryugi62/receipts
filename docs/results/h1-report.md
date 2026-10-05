### H1 — the app's whole path with the v3 bug fixes, sentence level, 49 ChatGPT test topics not in E-full (fresh at this level, run once) — 375 items, 49 topics, 69.3% not supported by humans

| System | Balanced accuracy [95 % CI] | Receipts minus this system (paired 95 % CI) | "Backed" → humans agree | Human-supported items it backs | False conflicts on human-supported | Skip (Backed) | Errors kept in the "check" pile | Random flagging, same amount | Errors named as "May conflict" | "May conflict" → not supported |
|---|---|---|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, as shipped) | 55.2% [51.6%–58.4%] | — | 68.2% (n=22) | 13.0% | 1.7% | 5.9% | 97.3% | 94.1% | 7.3% | 90.5% (n=21) |
| plain checker (top sentence + raw NLI label) | 54.9% [51.8%–57.8%] | 0.3 pts [-2.0, 2.8] | 76.5% (n=17) | 11.3% | 9.6% | 4.5% | 98.5% | 95.5% | 19.6% | 82.3% (n=62) |

"Errors kept in the check pile" = share of human-unsupported items that are not marked Backed. Flagging the same share of items at random would keep that share of errors (last column).
