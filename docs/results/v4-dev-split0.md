### Revision 4 dev — sentence level, ChatGPT dev topics, splitter current — 285 items, 40 topics, 74.7% not supported by humans

| System | Balanced accuracy [95 % CI] | Receipts minus this system (paired 95 % CI) | "Backed" → humans agree | Human-supported items it backs | False conflicts on human-supported | Skip (Backed) | Errors kept in the "check" pile | Random flagging, same amount | Errors named as "May conflict" | "May conflict" → not supported |
|---|---|---|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, as shipped) | 59.2% [54.6%–65.7%] | — | 66.7% (n=24) | 22.2% | 1.4% | 8.4% | 96.2% | 91.6% | 10.3% | 95.7% (n=23) |
| plain checker (top sentence + raw NLI label) | 56.9% [52.8%–61.0%] | 2.3 pts [-0.7, 6.3] | 66.7% (n=18) | 16.7% | 2.8% | 6.3% | 97.2% | 93.7% | 18.8% | 95.2% (n=42) |

"Errors kept in the check pile" = share of human-unsupported items that are not marked Backed. Flagging the same share of items at random would keep that share of errors (last column).
