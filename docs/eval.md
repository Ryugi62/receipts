# How I evaluated Receipts

Three questions, public human-labelled data, no training. Every table below is produced by a script in `scripts/`; per-item
results (evidence sentences and model scores) are in `docs/results/`. The Wikipedia pages used are published as a release asset
(`wiki-cache.tar.gz`) so the runs can be repeated on the same text.

## The short version (held-out numbers; misses included)
- **Unrelated sentences:** the small NLI model alone calls them a contradiction 74.3 % of the time; Receipts 0.0 % (E1).
- **Real ChatGPT answers (2,774 facts, 89 held-out topics):** when Receipts says **Backed**, humans agree 83.7 % (1,119 calls).
  Balanced accuracy 68.0 % — **below my 70 % target**, and statistically tied with a plain "top sentence + raw model" checker
  (67.1 %). "May conflict" is weak: 39.7 % of those calls match a human "not supported" label against a 37.0 % base rate, so the
  app words it as a hint to read the sentence, never as "false".
- **Where the gate earns its place:** when the subject's own article is not found (stress test), the plain checker based 216
  conflicts on a sentence about someone or something else; Receipts based 0. With the gate switched off, Receipts' own false
  conflicts on human-supported facts go from 13.9 % to 30.6 %.
- **Another chatbot (InstructGPT, 30 test topics):** no better than the plain checker (68.6 % vs 71.4 % balanced accuracy, wide
  intervals); more false conflicts on true facts (11.2 % vs 4.5 %). The gate does not make the small model a better judge of
  true facts — it stops it from judging on the wrong evidence.

## Protocol (what was fixed when)
1. Dev/test split of FActScore topics by a hash of the name, decided before any result (2/5 dev, 3/5 test). I ran the first 40 of
   the 68 dev topics (1,133 facts) to save time.
2. Selection rule (SPEC §7) written before the final dev run and before any test run: on dev, keep settings with "Backed"
   precision ≥ 85 % and "May conflict" precision ≥ 80 %, pick the best balanced accuracy; ship the smaller model unless the
   larger one is ≥ 3 points better. No setting reached the 80 % conflict floor, so the relaxed rule (Backed ≥ 85 %) applied, and
   the small model was kept (71.3 % vs 71.7 %).
3. Settings frozen in `web/config.json` (commit "freeze settings … before the held-out test run"), then one test run.
4. Disclosure: three biographies (Julia Faye, Carlos Santana, Marianne McAndrew) are UI samples I looked at while building — the
   subject rule was motivated by a Julia Faye sentence. Two of them fall in the test split, so every test table is also shown
   without them.
5. After the test run I changed three things, none tuned on test: batching (speed only), skipping Wikipedia "(disambiguation)"
   pages, and removing pronunciation/translation parentheses from lead sentences (found on the Eiffel Tower sample I wrote).
   The E2 tables are from the code at the freeze commit; E3 ran with batching and the disambiguation filter.

## E1 — Does it read the evidence? (Symmetric FEVER v0.2, 712 test pairs)
Each claim is checked with its real evidence sentence, and again with an **unrelated** sentence (another pair's evidence). Same
model outputs, four decision rules. The small model on its own ("plain checker") calls the unrelated sentence a contradiction
most of the time; even at the shipped 0.97 threshold, turning the gate off lets about half of them through as conflicts. With the
gate: zero.

**nli-deberta-v3-xsmall (shipped)**

| Setting | Real evidence: correct | Coverage (not "no receipt") | Correct when decided | SUPPORTS → backed | REFUTES → conflict | Unrelated sentence → "no receipt" | Unrelated → "conflict" |
|---|---|---|---|---|---|---|---|
| Receipts as shipped (gate + web/config.json thresholds) | 324/712 = 45.5% [41.9%–49.2%] | 336/712 = 47.2% [43.5%–50.9%] | 324/336 = 96.4% [93.9%–97.9%] | 207/356 = 58.1% [53.0%–63.2%] | 117/356 = 32.9% [28.2%–37.9%] | 710/712 = 99.7% [99.0%–99.9%] | 0/712 = 0.0% [0.0%–0.5%] |
| shipped thresholds, gate OFF | 474/712 = 66.6% [63.0%–69.9%] | 502/712 = 70.5% [67.1%–73.7%] | 474/502 = 94.4% [92.1%–96.1%] | 218/356 = 61.2% [56.1%–66.2%] | 256/356 = 71.9% [67.0%–76.3%] | 366/712 = 51.4% [47.7%–55.1%] | 343/712 = 48.2% [44.5%–51.8%] |
| gate ON, plain 0.6/0.6 thresholds | 406/712 = 57.0% [53.4%–60.6%] | 439/712 = 61.7% [58.0%–65.2%] | 406/439 = 92.5% [89.6%–94.6%] | 206/356 = 57.9% [52.7%–62.9%] | 200/356 = 56.2% [51.0%–61.2%] | 710/712 = 99.7% [99.0%–99.9%] | 0/712 = 0.0% [0.0%–0.5%] |
| plain checker: raw NLI label, no gate | 538/712 = 75.6% [72.3%–78.6%] | 602/712 = 84.6% [81.7%–87.0%] | 538/602 = 89.4% [86.7%–91.6%] | 220/356 = 61.8% [56.6%–66.7%] | 318/356 = 89.3% [85.7%–92.1%] | 180/712 = 25.3% [22.2%–28.6%] | 529/712 = 74.3% [71.0%–77.4%] |

- Claim-only cue baseline (negation word → refutes): 356/712 = 50.0% [46.3%–53.7%] — the symmetric set is built so the claim alone carries no signal (a property of the data set, not of our model).
- "Unrelated" = the evidence sentence of the pair 356 rows away (a different subject). This is the easy case; hard, same-topic cases are measured in E2 on real labels (false conflicts on human-supported facts).
- Runtime: 24 s (batched inference, laptop CPU).

**DeBERTa-v3-base-mnli-fever-anli (larger, 244 MB vs 87 MB)**

| Setting | Real evidence: correct | Coverage (not "no receipt") | Correct when decided | SUPPORTS → backed | REFUTES → conflict | Unrelated sentence → "no receipt" | Unrelated → "conflict" |
|---|---|---|---|---|---|---|---|
| Receipts as shipped (gate + web/config.json thresholds) | 256/712 = 36.0% [32.5%–39.5%] | 288/712 = 40.4% [36.9%–44.1%] | 256/288 = 88.9% [84.7%–92.0%] | 245/356 = 68.8% [63.8%–73.4%] | 11/356 = 3.1% [1.7%–5.4%] | 710/712 = 99.7% [99.0%–99.9%] | 0/712 = 0.0% [0.0%–0.5%] |
| shipped thresholds, gate OFF | 282/712 = 39.6% [36.1%–43.2%] | 321/712 = 45.1% [41.5%–48.8%] | 282/321 = 87.9% [83.8%–91.0%] | 264/356 = 74.2% [69.4%–78.4%] | 18/356 = 5.1% [3.2%–7.9%] | 700/712 = 98.3% [97.1%–99.0%] | 1/712 = 0.1% [0.0%–0.8%] |
| gate ON, plain 0.6/0.6 thresholds | 356/712 = 50.0% [46.3%–53.7%] | 389/712 = 54.6% [51.0%–58.3%] | 356/389 = 91.5% [88.3%–93.9%] | 237/356 = 66.6% [61.5%–71.3%] | 119/356 = 33.4% [28.7%–38.5%] | 710/712 = 99.7% [99.0%–99.9%] | 0/712 = 0.0% [0.0%–0.5%] |
| plain checker: raw NLI label, no gate | 466/712 = 65.4% [61.9%–68.9%] | 533/712 = 74.9% [71.5%–77.9%] | 466/533 = 87.4% [84.3%–90.0%] | 266/356 = 74.7% [70.0%–79.0%] | 200/356 = 56.2% [51.0%–61.2%] | 637/712 = 89.5% [87.0%–91.5%] | 64/712 = 9.0% [7.1%–11.3%] |

- Claim-only cue baseline (negation word → refutes): 356/712 = 50.0% [46.3%–53.7%] — the symmetric set is built so the claim alone carries no signal (a property of the data set, not of our model).
- "Unrelated" = the evidence sentence of the pair 356 rows away (a different subject). This is the easy case; hard, same-topic cases are measured in E2 on real labels (false conflicts on human-supported facts).
- Runtime: 62 s (batched inference, laptop CPU).

What the gate costs: on this set it also drops many genuine refutations (the subject rule is strict), so coverage falls. That is
the trade I chose for a tool that tells students "this may be wrong" — a false alarm about a true fact is the costly error.

## E2 — Real ChatGPT answers (FActScore, Min et al., EMNLP 2023)
Human-written atomic facts from ChatGPT biographies, each labelled supported / not supported against Wikipedia. Pipeline from
retrieval onward: live Wikipedia search (disk-cached), pre-filter, embedding ranking, NLI, gate, verdict. The app's own sentence
splitter is not used here (the human atomic facts are the inputs), so this measures retrieval + reading.
Labels were made on 2023 Wikipedia; the pipeline reads today's, so some "errors" are the article changing.

Settings frozen on dev: gate {"minSimilarity":0.4,"minSharedTokens":1,"ignoreTopicTokens":true}, thresholds {"entail":0.5,"contradict":0.97,"contradictNeedsSubject":true,"entailNeedsSubject":false}. Intervals: 95 % bootstrap over topics (1,000 resamples).

### All test topics — 2774 facts, 89 topics, 37.0% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (frozen dev settings) | 68.0% [65.4%–70.2%] | 83.7% [78.2%–87.8%] (n=1119) | 39.7% [32.7%–48.8%] (n=403) | 13.9% [11.0%–16.6%] | 10 | 59.7% | 38.2% (60.1%) |
| same thresholds, gate OFF | 66.8% [64.8%–68.8%] | 84.5% [79.6%–88.5%] (n=1011) | 43.1% [37.4%–49.9%] (n=938) | 30.6% [27.4%–33.5%] | 287 | 63.6% | 34.8% (60.1%) |
| plain checker (top sentence + raw NLI label) | 67.1% [64.9%–68.8%] | 85.9% [80.8%–89.4%] (n=964) | 56.4% [49.8%–64.9%] (n=477) | 11.9% [10.1%–13.7%] | 107 | 65.2% | 33.3% (60.1%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (60.1%) |

### Without the topics used as UI samples during development (Julia Faye, Carlos Santana, Marianne McAndrew) — 2715 facts, 87 topics, 37.2% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (frozen dev settings) | 68.0% [65.4%–70.3%] | 83.8% [77.6%–87.9%] (n=1087) | 39.7% [32.6%–48.9%] (n=395) | 14.0% [10.9%–16.7%] | 10 | 60.0% | 37.9% (59.9%) |
| same thresholds, gate OFF | 66.8% [64.8%–68.9%] | 84.5% [79.1%–88.4%] (n=983) | 43.0% [37.7%–50.5%] (n=918) | 30.7% [27.7%–33.5%] | 279 | 63.8% | 34.6% (59.9%) |
| plain checker (top sentence + raw NLI label) | 67.2% [65.0%–69.0%] | 86.0% [80.5%–89.5%] (n=938) | 56.6% [50.7%–65.5%] (n=465) | 11.8% [9.9%–13.3%] | 105 | 65.5% | 33.0% (59.9%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (59.9%) |

### Stress test — evidence only from other pages (as if the subject had no article of their own) — 2774 facts, 89 topics, 37.0% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (frozen dev settings) | 55.6% [53.4%–57.8%] | 76.9% [67.7%–84.4%] (n=520) | 38.5% [20.0%–63.0%] (n=26) | 0.9% [0.5%–1.3%] | 0 | 81.3% | 17.4% (60.1%) |
| same thresholds, gate OFF | 55.4% [53.7%–57.5%] | 77.6% [69.3%–84.7%] (n=474) | 48.8% [39.7%–57.5%] (n=283) | 8.3% [6.8%–10.0%] | 234 | 82.9% | 15.9% (60.1%) |
| plain checker (top sentence + raw NLI label) | 55.8% [54.0%–57.8%] | 80.0% [70.7%–86.6%] (n=444) | 51.0% [43.4%–60.3%] (n=304) | 8.5% [6.7%–10.3%] | 216 | 84.0% | 14.9% (60.1%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (60.1%) |

Dev (used for choosing — optimistic by construction):
Settings frozen on dev: gate {"minSimilarity":0.4,"minSharedTokens":1,"ignoreTopicTokens":true}, thresholds {"entail":0.5,"contradict":0.97,"contradictNeedsSubject":true,"entailNeedsSubject":false}. Intervals: 95 % bootstrap over topics (1,000 resamples).

### All dev topics — 1133 facts, 40 topics, 41.9% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (frozen dev settings) | 71.3% [68.4%–74.0%] | 86.8% [81.2%–91.1%] (n=409) | 52.9% [41.3%–66.0%] (n=153) | 10.9% [8.2%–14.1%] | 6 | 63.9% | 35.0% (54.6%) |
| same thresholds, gate OFF | 67.8% [65.3%–70.5%] | 85.3% [78.9%–90.2%] (n=361) | 48.9% [39.9%–59.4%] (n=401) | 31.2% [27.1%–35.6%] | 112 | 68.1% | 30.5% (54.6%) |
| plain checker (top sentence + raw NLI label) | 68.7% [66.0%–71.4%] | 88.3% [82.5%–92.5%] (n=342) | 56.5% [43.7%–68.7%] (n=200) | 13.2% [10.5%–15.8%] | 20 | 69.8% | 29.9% (54.6%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (54.6%) |

### Without the topics used as UI samples during development (Julia Faye, Carlos Santana, Marianne McAndrew) — 1113 facts, 39 topics, 41.7% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (frozen dev settings) | 71.8% [69.4%–74.6%] | 87.8% [82.2%–92.2%] (n=400) | 53.3% [39.5%–65.5%] (n=152) | 10.9% [8.2%–14.0%] | 6 | 64.1% | 34.8% (54.8%) |
| same thresholds, gate OFF | 67.8% [65.1%–70.4%] | 85.4% [78.8%–90.5%] (n=356) | 48.2% [38.5%–58.5%] (n=392) | 31.3% [27.1%–35.7%] | 105 | 68.0% | 30.7% (54.8%) |
| plain checker (top sentence + raw NLI label) | 69.0% [66.4%–71.7%] | 89.0% [83.5%–93.1%] (n=335) | 56.1% [42.9%–68.0%] (n=198) | 13.4% [10.8%–15.9%] | 20 | 69.9% | 29.7% (54.8%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (54.8%) |

### Stress test — evidence only from other pages (as if the subject had no article of their own) — 1133 facts, 40 topics, 41.9% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (frozen dev settings) | 57.4% [55.0%–59.9%] | 82.2% [72.4%–89.4%] (n=169) | 33.3% [12.5%–60.0%] (n=18) | 1.8% [0.8%–3.2%] | 2 | 85.1% | 14.2% (54.6%) |
| same thresholds, gate OFF | 56.8% [55.0%–58.5%] | 84.1% [75.0%–91.0%] (n=145) | 41.3% [26.7%–57.4%] (n=109) | 9.7% [6.9%–12.6%] | 80 | 87.2% | 12.1% (54.6%) |
| plain checker (top sentence + raw NLI label) | 56.8% [54.8%–58.9%] | 84.1% [75.4%–90.6%] (n=145) | 46.2% [32.0%–60.9%] (n=104) | 8.5% [6.3%–10.8%] | 70 | 87.2% | 12.2% (54.6%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (54.6%) |

## E3 — Does it carry over to another chatbot? (FActScore InstructGPT biographies, test topics, same frozen settings)
Settings frozen on dev: gate {"minSimilarity":0.4,"minSharedTokens":1,"ignoreTopicTokens":true}, thresholds {"entail":0.5,"contradict":0.97,"contradictNeedsSubject":true,"entailNeedsSubject":false}. Intervals: 95 % bootstrap over topics (1,000 resamples).

### All test topics — 594 facts, 30 topics, 85.0% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (frozen dev settings) | 68.6% [60.8%–78.3%] | 37.3% [21.2%–55.1%] (n=126) | 79.2% [69.0%–95.7%] (n=48) | 11.2% [1.7%–22.6%] | 2 | 78.8% | 19.9% (15.1%) |
| same thresholds, gate OFF | 72.5% [64.2%–82.5%] | 45.1% [28.3%–62.9%] (n=113) | 92.4% [87.4%–97.5%] (n=276) | 23.6% [8.7%–40.0%] | 123 | 81.0% | 17.7% (15.1%) |
| plain checker (top sentence + raw NLI label) | 71.4% [66.6%–77.5%] | 44.1% [27.6%–61.4%] (n=111) | 97.8% [94.4%–100.0%] (n=180) | 4.5% [0.0%–10.8%] | 52 | 81.3% | 18.2% (15.1%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (15.1%) |

### Without the topics used as UI samples during development (Julia Faye, Carlos Santana, Marianne McAndrew) — 594 facts, 30 topics, 85.0% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (frozen dev settings) | 68.6% [60.8%–78.3%] | 37.3% [21.2%–55.1%] (n=126) | 79.2% [69.0%–95.7%] (n=48) | 11.2% [1.7%–22.6%] | 2 | 78.8% | 19.9% (15.1%) |
| same thresholds, gate OFF | 72.5% [64.2%–82.5%] | 45.1% [28.3%–62.9%] (n=113) | 92.4% [87.4%–97.5%] (n=276) | 23.6% [8.7%–40.0%] | 123 | 81.0% | 17.7% (15.1%) |
| plain checker (top sentence + raw NLI label) | 71.4% [66.6%–77.5%] | 44.1% [27.6%–61.4%] (n=111) | 97.8% [94.4%–100.0%] (n=180) | 4.5% [0.0%–10.8%] | 52 | 81.3% | 18.2% (15.1%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (15.1%) |

### Stress test — evidence only from other pages (as if the subject had no article of their own) — 594 facts, 30 topics, 85.0% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (frozen dev settings) | 53.3% [48.8%–59.6%] | 20.7% [10.5%–38.1%] (n=87) | 66.7% [40.0%–100.0%] (n=9) | 3.4% [0.0%–10.0%] | 1 | 85.4% | 13.0% (15.1%) |
| same thresholds, gate OFF | 55.1% [51.0%–61.1%] | 25.3% [13.5%–43.4%] (n=75) | 93.8% [88.6%–98.3%] (n=146) | 10.1% [3.1%–23.3%] | 121 | 87.4% | 11.7% (15.1%) |
| plain checker (top sentence + raw NLI label) | 54.7% [50.9%–60.3%] | 24.7% [12.9%–42.6%] (n=73) | 93.8% [88.3%–98.1%] (n=144) | 10.1% [4.2%–20.0%] | 106 | 87.7% | 11.6% (15.1%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (15.1%) |

## What I did not do
- No model training or fine-tuning; thresholds and gate settings are the only tuned numbers.
- No labels of my own: all labels come from the datasets' authors.
- No user study yet. The claims about students are a design goal, not a measured outcome.
