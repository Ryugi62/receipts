# E1 Symmetric FEVER v0.2 dev (708 pairs) — model Xenova/DeBERTa-v3-base-mnli-fever-anli (q8), thresholds entail 0.6 / contradict 0.6
- Real evidence, correct verdict: 401/708 = 56.6% [53.0%–60.2%] (decided 433/708 = 61.2% [57.5%–64.7%]; undecided = no_receipt)
- Real evidence, accuracy when decided: 401/433 = 92.6% [89.8%–94.7%]
- Swapped (unrelated) evidence -> no_receipt WITH relevance gate: 703/708 = 99.3% [98.4%–99.7%]
- Swapped evidence -> no_receipt, raw model (no gate): 660/708 = 93.2% [91.1%–94.8%]; raw model says "contradicted": 40/708 = 5.6% [4.2%–7.6%]
- Claim-only cue baseline (negation word => REFUTES): 354/708 = 50.0% [46.3%–53.7%] — the symmetric set is built so the claim alone gives no signal
- Runtime: 57 s on this machine
