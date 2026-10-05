# E1 Symmetric FEVER v0.2 test (712 pairs) — model Xenova/DeBERTa-v3-base-mnli-fever-anli (q8), thresholds entail 0.6 / contradict 0.6
- Real evidence, correct verdict: 432/712 = 60.7% [57.0%–64.2%] (decided 472/712 = 66.3% [62.7%–69.7%]; undecided = no_receipt)
- Real evidence, accuracy when decided: 432/472 = 91.5% [88.7%–93.7%]
- Swapped (unrelated) evidence -> no_receipt WITH relevance gate: 709/712 = 99.6% [98.8%–99.9%]
- Swapped evidence -> no_receipt, raw model (no gate): 666/712 = 93.5% [91.5%–95.1%]; raw model says "contradicted": 38/712 = 5.3% [3.9%–7.2%]
- Claim-only cue baseline (negation word => REFUTES): 356/712 = 50.0% [46.3%–53.7%] — the symmetric set is built so the claim alone gives no signal
- Runtime: 42 s on this machine
