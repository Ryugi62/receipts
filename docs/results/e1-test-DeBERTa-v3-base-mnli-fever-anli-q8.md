# E1 Symmetric FEVER v0.2 test (712 pairs) — model Xenova/DeBERTa-v3-base-mnli-fever-anli (q8)

| Setting | Real evidence: correct | Coverage (not "no receipt") | Correct when decided | SUPPORTS → backed | REFUTES → conflict | Unrelated sentence → "no receipt" | Unrelated → "conflict" |
|---|---|---|---|---|---|---|---|
| Receipts as shipped (gate + web/config.json thresholds) | 256/712 = 36.0% [32.5%–39.5%] | 283/712 = 39.7% [36.2%–43.4%] | 256/283 = 90.5% [86.5%–93.4%] | 243/356 = 68.3% [63.3%–72.9%] | 13/356 = 3.7% [2.1%–6.1%] | 708/712 = 99.4% [98.6%–99.8%] | 0/712 = 0.0% [0.0%–0.5%] |
| shipped thresholds, gate OFF | 264/712 = 37.1% [33.6%–40.7%] | 291/712 = 40.9% [37.3%–44.5%] | 264/291 = 90.7% [86.8%–93.5%] | 246/356 = 69.1% [64.1%–73.7%] | 18/356 = 5.1% [3.2%–7.9%] | 707/712 = 99.3% [98.4%–99.7%] | 1/712 = 0.1% [0.0%–0.8%] |
| gate ON, plain 0.6/0.6 thresholds | 426/712 = 59.8% [56.2%–63.4%] | 472/712 = 66.3% [62.7%–69.7%] | 426/472 = 90.3% [87.2%–92.6%] | 252/356 = 70.8% [65.9%–75.3%] | 174/356 = 48.9% [43.7%–54.1%] | 705/712 = 99.0% [98.0%–99.5%] | 3/712 = 0.4% [0.1%–1.2%] |
| plain checker: raw NLI label, no gate | 466/712 = 65.4% [61.9%–68.9%] | 533/712 = 74.9% [71.5%–77.9%] | 466/533 = 87.4% [84.3%–90.0%] | 266/356 = 74.7% [70.0%–79.0%] | 200/356 = 56.2% [51.0%–61.2%] | 637/712 = 89.5% [87.0%–91.5%] | 64/712 = 9.0% [7.1%–11.3%] |

- Claim-only cue baseline (negation word → refutes): 356/712 = 50.0% [46.3%–53.7%] — the symmetric set is built so the claim alone carries no signal (a property of the data set, not of our model).
- "Unrelated" = the evidence sentence of the pair 356 rows away (a different subject). This is the easy case; hard, same-topic cases are measured in E2 on real labels (false conflicts on human-supported facts).
- Runtime: 57 s (batched inference, laptop CPU).
