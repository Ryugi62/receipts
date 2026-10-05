# E1 Symmetric FEVER v0.2 test (712 pairs) — model Xenova/nli-deberta-v3-xsmall (q8)

| Setting | Real evidence: correct | Coverage (not "no receipt") | Correct when decided | SUPPORTS → backed | REFUTES → conflict | Unrelated sentence → "no receipt" | Unrelated → "conflict" |
|---|---|---|---|---|---|---|---|
| Receipts as shipped (gate + web/config.json thresholds) | 388/712 = 54.5% [50.8%–58.1%] | 398/712 = 55.9% [52.2%–59.5%] | 388/398 = 97.5% [95.4%–98.6%] | 213/356 = 59.8% [54.7%–64.8%] | 175/356 = 49.2% [44.0%–54.3%] | 707/712 = 99.3% [98.4%–99.7%] | 2/712 = 0.3% [0.1%–1.0%] |
| shipped thresholds, gate OFF | 471/712 = 66.2% [62.6%–69.5%] | 492/712 = 69.1% [65.6%–72.4%] | 471/492 = 95.7% [93.6%–97.2%] | 215/356 = 60.4% [55.2%–65.3%] | 256/356 = 71.9% [67.0%–76.3%] | 366/712 = 51.4% [47.7%–55.1%] | 343/712 = 48.2% [44.5%–51.8%] |
| gate ON, plain 0.6/0.6 thresholds | 514/712 = 72.2% [68.8%–75.4%] | 564/712 = 79.2% [76.1%–82.0%] | 514/564 = 91.1% [88.5%–93.2%] | 215/356 = 60.4% [55.2%–65.3%] | 299/356 = 84.0% [79.8%–87.4%] | 705/712 = 99.0% [98.0%–99.5%] | 4/712 = 0.6% [0.2%–1.4%] |
| plain checker: raw NLI label, no gate | 538/712 = 75.6% [72.3%–78.6%] | 602/712 = 84.6% [81.7%–87.0%] | 538/602 = 89.4% [86.7%–91.6%] | 220/356 = 61.8% [56.6%–66.7%] | 318/356 = 89.3% [85.7%–92.1%] | 180/712 = 25.3% [22.2%–28.6%] | 529/712 = 74.3% [71.0%–77.4%] |

- Claim-only cue baseline (negation word → refutes): 356/712 = 50.0% [46.3%–53.7%] — the symmetric set is built so the claim alone carries no signal (a property of the data set, not of our model).
- "Unrelated" = the evidence sentence of the pair 356 rows away (a different subject). This is the easy case; hard, same-topic cases are measured in E2 on real labels (false conflicts on human-supported facts).
- Runtime: 23 s (batched inference, laptop CPU).
