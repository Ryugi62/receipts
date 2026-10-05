### Revision 4 dev — sentence level, ChatGPT dev topics, splitter v4 (new rules) — 285 items, 40 topics, 74.7% not supported by humans

| System | Balanced accuracy [95 % CI] | Receipts minus this system (paired 95 % CI) | "Backed" → humans agree | Human-supported items it backs | False conflicts on human-supported | Skip (Backed) | Errors kept in the "check" pile | Random flagging, same amount | Errors named as "May conflict" | "May conflict" → not supported |
|---|---|---|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, as shipped) | 59.5% [55.2%–64.7%] | — | 69.6% (n=23) | 22.2% | 4.2% | 8.1% | 96.7% | 91.9% | 10.8% | 88.5% (n=26) |
| plain checker (top sentence + raw NLI label) | 57.2% [53.6%–60.8%] | 2.3 pts [-1.1, 6.8] | 70.6% (n=17) | 16.7% | 5.6% | 6.0% | 97.7% | 94.0% | 21.6% | 92.0% (n=50) |

"Errors kept in the check pile" = share of human-unsupported items that are not marked Backed. Flagging the same share of items at random would keep that share of errors (last column).
