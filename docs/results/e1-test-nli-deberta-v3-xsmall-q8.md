# E1 Symmetric FEVER v0.2 test (712 pairs) — model Xenova/nli-deberta-v3-xsmall (q8), thresholds entail 0.6 / contradict 0.6
- Real evidence, correct verdict: 500/712 = 70.2% [66.8%–73.5%] (decided 547/712 = 76.8% [73.6%–79.8%]; undecided = no_receipt)
- Real evidence, accuracy when decided: 500/547 = 91.4% [88.8%–93.5%]
- Swapped (unrelated) evidence -> no_receipt WITH relevance gate: 707/712 = 99.3% [98.4%–99.7%]
- Swapped evidence -> no_receipt, raw model (no gate): 200/712 = 28.1% [24.9%–31.5%]; raw model says "contradicted": 510/712 = 71.6% [68.2%–74.8%]
- Claim-only cue baseline (negation word => REFUTES): 356/712 = 50.0% [46.3%–53.7%] — the symmetric set is built so the claim alone gives no signal
- Runtime: 29 s on this machine
