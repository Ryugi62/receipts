# E1 Symmetric FEVER v0.2 test (712 pairs) — model Xenova/nli-deberta-v3-xsmall (q8)

| Setting | Real evidence: correct | Coverage (not "no receipt") | Correct when decided | SUPPORTS → backed | REFUTES → conflict | Unrelated sentence → "no receipt" | Unrelated → "conflict" |
|---|---|---|---|---|---|---|---|
| Receipts as shipped (gate + web/config.json thresholds) | 324/712 = 45.5% [41.9%–49.2%] | 336/712 = 47.2% [43.5%–50.9%] | 324/336 = 96.4% [93.9%–97.9%] | 207/356 = 58.1% [53.0%–63.2%] | 117/356 = 32.9% [28.2%–37.9%] | 710/712 = 99.7% [99.0%–99.9%] | 0/712 = 0.0% [0.0%–0.5%] |
| shipped thresholds, gate OFF | 474/712 = 66.6% [63.0%–69.9%] | 502/712 = 70.5% [67.1%–73.7%] | 474/502 = 94.4% [92.1%–96.1%] | 218/356 = 61.2% [56.1%–66.2%] | 256/356 = 71.9% [67.0%–76.3%] | 366/712 = 51.4% [47.7%–55.1%] | 343/712 = 48.2% [44.5%–51.8%] |
| gate ON, plain 0.6/0.6 thresholds | 406/712 = 57.0% [53.4%–60.6%] | 439/712 = 61.7% [58.0%–65.2%] | 406/439 = 92.5% [89.6%–94.6%] | 206/356 = 57.9% [52.7%–62.9%] | 200/356 = 56.2% [51.0%–61.2%] | 710/712 = 99.7% [99.0%–99.9%] | 0/712 = 0.0% [0.0%–0.5%] |
| plain checker: raw NLI label, no gate | 538/712 = 75.6% [72.3%–78.6%] | 602/712 = 84.6% [81.7%–87.0%] | 538/602 = 89.4% [86.7%–91.6%] | 220/356 = 61.8% [56.6%–66.7%] | 318/356 = 89.3% [85.7%–92.1%] | 180/712 = 25.3% [22.2%–28.6%] | 529/712 = 74.3% [71.0%–77.4%] |

- Claim-only cue baseline (negation word → refutes): 356/712 = 50.0% [46.3%–53.7%] — the symmetric set is built so the claim alone carries no signal (a property of the data set, not of our model).
- "Unrelated" = the evidence sentence of the pair 356 rows away (a different subject). This is the easy case; hard, same-topic cases are measured in E2 on real labels (false conflicts on human-supported facts).
- Runtime: 24 s (batched inference, laptop CPU).
