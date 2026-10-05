# E1 Symmetric FEVER v0.2 test (712 pairs) — model Xenova/DeBERTa-v3-base-mnli-fever-anli (q8)

| Setting | Real evidence: correct | Coverage (not "no receipt") | Correct when decided | SUPPORTS → backed | REFUTES → conflict | Unrelated sentence → "no receipt" | Unrelated → "conflict" |
|---|---|---|---|---|---|---|---|
| Receipts as shipped (gate + web/config.json thresholds) | 256/712 = 36.0% [32.5%–39.5%] | 288/712 = 40.4% [36.9%–44.1%] | 256/288 = 88.9% [84.7%–92.0%] | 245/356 = 68.8% [63.8%–73.4%] | 11/356 = 3.1% [1.7%–5.4%] | 710/712 = 99.7% [99.0%–99.9%] | 0/712 = 0.0% [0.0%–0.5%] |
| shipped thresholds, gate OFF | 282/712 = 39.6% [36.1%–43.2%] | 321/712 = 45.1% [41.5%–48.8%] | 282/321 = 87.9% [83.8%–91.0%] | 264/356 = 74.2% [69.4%–78.4%] | 18/356 = 5.1% [3.2%–7.9%] | 700/712 = 98.3% [97.1%–99.0%] | 1/712 = 0.1% [0.0%–0.8%] |
| gate ON, plain 0.6/0.6 thresholds | 356/712 = 50.0% [46.3%–53.7%] | 389/712 = 54.6% [51.0%–58.3%] | 356/389 = 91.5% [88.3%–93.9%] | 237/356 = 66.6% [61.5%–71.3%] | 119/356 = 33.4% [28.7%–38.5%] | 710/712 = 99.7% [99.0%–99.9%] | 0/712 = 0.0% [0.0%–0.5%] |
| plain checker: raw NLI label, no gate | 466/712 = 65.4% [61.9%–68.9%] | 533/712 = 74.9% [71.5%–77.9%] | 466/533 = 87.4% [84.3%–90.0%] | 266/356 = 74.7% [70.0%–79.0%] | 200/356 = 56.2% [51.0%–61.2%] | 637/712 = 89.5% [87.0%–91.5%] | 64/712 = 9.0% [7.1%–11.3%] |

- Claim-only cue baseline (negation word → refutes): 356/712 = 50.0% [46.3%–53.7%] — the symmetric set is built so the claim alone carries no signal (a property of the data set, not of our model).
- "Unrelated" = the evidence sentence of the pair 356 rows away (a different subject). This is the easy case; hard, same-topic cases are measured in E2 on real labels (false conflicts on human-supported facts).
- Runtime: 62 s (batched inference, laptop CPU).
