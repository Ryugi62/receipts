# How I evaluated Receipts

Public, human-labelled data; no training; every table below is produced by a script in `scripts/`, and per-item results
(evidence sentences and model scores) are in `docs/results/`. Wikipedia text used: release asset `wiki-cache.tar.gz` (v0.1).
"Plain checker" = the obvious baseline: take the most relevant sentence and the NLI model's raw label, no gate, no thresholds.

## The short version
- **Fresh held-out set (PerplexityAI biographies, 1,253 facts, 35 topics, run once after freezing):** balanced accuracy
  **70.7 %** vs 66.6 % for the plain checker (paired topic-bootstrap difference +4.1 points, 95 % CI [1.9, 6.4]); false
  "May conflict" on facts humans found true **3.6 %** vs **12.9 %**. The 70 % target is met only as a point estimate (borderline).
- **What does the work (ablation):** almost all of the gain on real answers comes from one asymmetric rule — any good sentence
  may back a claim, but only the single most relevant sentence may raise a conflict. Removing it erases the gain (+0.0 points)
  and false conflicts jump to 23 %. The similarity gate changes nothing on these answers; it matters when the evidence is about
  something else: unrelated sentences called a conflict 48.2 % without it, 0.3 % with it (Symmetric FEVER, 712 pairs).
- **The price, stated plainly:** Receipts rarely catches an error by itself — only 6 % of unsupported facts become
  "May conflict" (plain checker: 25 %). "Backed" is as precise as the plain checker (94.1 % vs 94.3 %, base rate 84 % supported)
  but covers more facts (698 vs 548). On InstructGPT answers, where 85 % of facts are unsupported, "Backed" is right only 40 %
  of the time. On whole sentences through the app's own splitter and topic guess it backs few (balanced 57.1 %, tied).
- **As a filter (triage view):** on the fresh set it marks 55.7 % of facts Backed (94.1 % right), and 79.2 % of the facts humans
  could not support stay in the "check yourself" pile; skipping the same share at random would keep 44.3 %. The plain checker keeps
  84.3 % but lets you skip only 43.7 %.
- **Beyond biographies (E4, SPEC §12, run once with the shipped settings):** the app's whole path — topic guess, splitter, live
  Wikipedia, model, gate — on 355 original FEVER claims: balanced accuracy 75.5 % vs 68.4 % for the plain checker (paired
  difference +7.0 points [4.6, 9.5]); false "May conflict" on true claims 5.4 % vs 18.4 %; "May conflict" is right 88.1 % of the
  time but names only 28.4 % of the false claims (plain checker: 70.7 %).
- **The gate's cost on real refutations (E1):** with the correct FEVER evidence sentence handed over, shipped Receipts decides
  55.9 % of claims (97.5 % right when it decides) and calls 49.2 % of refutations a conflict, vs 89.3 % for the plain checker.
- **On a slowed laptop** (Chrome CPU throttled 4×, fresh profile, scripts/slow-laptop.mjs): first result 21 s and all four claims
  44 s on the first visit including the model download; a six-sentence answer 66 s once the models are cached.
- v1 missed: 68.0 % on its held-out run, tied with the plain checker and worse on false conflicts — that is why v2 exists.
- **Revision 3 missed its bar, twice** (SPEC §11, pushed before each run): cleaning the evidence text (+0.7 points on dev) and
  reading 8 or 10 sentences instead of 5 (≤ +0.5) both stayed under the pre-registered +1.0 bar, so neither shipped; only two bug
  fixes did. A fresh check of the app's whole path (H1, 375 sentences, 49 new topics) gives 55.2 % — the same as the plain checker
  (Receipts − plain = +0.3 points [−2.0, 2.8]); it backs 13 % of the sentences humans support. Whole raw sentences remain the weak spot.

## History and protocol
1. FActScore topics split by a hash of the name into dev (2/5) and test (3/5) before any result.
2. **v1** (SPEC §7): settings chosen on 40 ChatGPT dev topics, frozen, one test run → 68.0 %, a tie with the plain checker and
   worse on false conflicts (13.9 % vs 11.9 %). Reported below unchanged.
3. **v2** (SPEC §9, pushed to GitHub before running it): two decision options — a conflict may only come from the most relevant
   gated sentence; disagreeing sources may abstain — and a selection rule that requires beating the plain checker on false
   conflicts and conflict precision **on dev**. Then one run on a **fresh** set (PerplexityAI, 40 hash-chosen test topics; 5 had
   no supported/unsupported facts, leaving 35). The answers and labels are new, but 30 of the 35 people also appear in the
   ChatGPT test topics whose v1 errors motivated v2.
4. Disclosure: Julia Faye, Carlos Santana and Marianne McAndrew are UI samples I looked at while building; each table is also
   shown without them. Post-freeze code changes (batching; skipping "(disambiguation)" pages; dropping pronunciation
   parentheses) were not tuned on any test data; the PerplexityAI and sentence-level runs used the final code.
5. **Revision 3** (SPEC §11 and §11.1, each pushed before its run): bug fixes (splitter abbreviations, disambiguation in the
   subject name) plus two options chosen on dev only — evidence clean-up and wider reading. Neither cleared the +1.0-point bar.
   H1 was run once after the choice was pushed, on the 49 ChatGPT test topics never run at sentence level. Disclosure: while
   diagnosing I looked at two items of the earlier E-full set, whose 40 topics are excluded from H1.
6. **Server-side timestamps.** Every push runs the site's GitHub Actions workflow, and GitHub records when
   (https://github.com/Ryugi62/receipts/actions): §9 pre-registration 2026-10-05 10:45:09Z → v2 settings frozen 10:48:38Z →
   held-out results 12:10:44Z; §11 pre-registration 16:56:19Z → §11.1 17:07:00Z → selection pushed 17:47:35Z → H1 report
   17:50:42Z; §12 (E4) pushed before its run. Disclosure: the H1 run that stores raw model scores finished at 17:41Z, before the
   selection was pushed; the selection script reads only the dev file, and the H1 report was produced after the push.
7. The count "conflicts resting on a sentence about someone else" uses the gate's own subject rule, so it is circular for
   Receipts; it is kept in the tables for the baselines only and is not used as evidence.

## Revision 3 — pre-registered options that did not clear the bar (dev), and H1

| System (same retrieved sentences) | Balanced accuracy | "Backed" precision | "May conflict" precision | False conflicts on supported |
|---|---|---|---|---|
| plain checker (raw) | 68.5% | 87.4% (n=349) | 57.7% (n=208) | 13.4% |
| v2 settings, raw evidence | 73.1% | 85.7% (n=462) | 58.2% (n=79) | 5.0% |
| v2 settings, cleaned evidence | 73.8% | 86.0% (n=470) | 58.0% (n=81) | 5.2% |
| best cleaned setting under the rule | 73.8% | 86.0% (n=470) | 58.0% (n=81) | 5.2% |

Rule: all of (a)(b)(c); 2897 of 7680 settings qualify.
Best cleaned: gate {"minSimilarity":0.2,"minSharedTokens":0,"ignoreTopicTokens":false}, thresholds {"entail":0.7,"contradict":0.97,"contradictNeedsSubject":true,"entailNeedsSubject":false,"conflictFromTopOnly":true,"disagreement":"contradicted"}
Decision (ship v3 only if ≥ 1.0 point above v2 on raw evidence): **keep v2 settings (cleanEvidence off) + bug fixes** — 73.8% vs 73.1%.


| System (same retrieved sentences) | Balanced accuracy | "Backed" precision | "May conflict" precision | False conflicts on supported |
|---|---|---|---|---|
| plain checker (raw) | 69.2% | 88.3% (n=350) | 59.1% (n=208) | 12.9% |
| v2 settings, raw evidence | 73.0% | 85.5% (n=462) | 59.5% (n=84) | 5.2% |
| v2 settings, cleaned evidence | 73.5% | 85.6% (n=471) | 54.9% (n=82) | 5.6% |
| best under the rule (top 5, cleaned) | 73.5% | 85.7% (n=469) | 67.1% (n=70) | 3.5% |

| Arm (best setting) | Balanced | Backed precision | Conflict precision | False conflicts | Settings qualifying |
|---|---|---|---|---|---|
| top 5, raw | 73.0% | 85.5% (n=462) | 59.5% (n=84) | 5.2% | 2950 |
| top 5, cleaned | 73.5% | 85.7% (n=469) | 67.1% (n=70) | 3.5% | 2573 |
| top 8, raw | 73.1% | 85.7% (n=461) | 64.5% (n=76) | 4.1% | 2082 |
| top 8, cleaned | 73.2% | 85.5% (n=468) | 60.3% (n=68) | 4.1% | 1634 |
| top 10, raw | 73.0% | 85.1% (n=469) | 65.3% (n=72) | 3.8% | 1538 |
| top 10, cleaned | 72.5% | 85.2% (n=458) | 64.7% (n=68) | 3.6% | 1032 |

Rule: all of (a)(b)(c); 11809 settings qualify across arms.
Best: top 5, cleaned evidence, gate {"minSimilarity":0.2,"minSharedTokens":0,"ignoreTopicTokens":false}, thresholds {"entail":0.7,"contradict":0.9,"contradictNeedsSubject":true,"entailNeedsSubject":false,"conflictFromTopOnly":true,"disagreement":"no_receipt"}
Decision (ship only if ≥ 1.0 point above v2, top 5, raw evidence): **keep v2 settings (top 5, cleanEvidence off) + bug fixes** — 73.5% vs 73.0%.

### H1 — the app's whole path with the v3 bug fixes, sentence level, 49 ChatGPT test topics not in E-full (fresh at this level, run once) — 375 items, 49 topics, 69.3% not supported by humans

| System | Balanced accuracy [95 % CI] | Receipts minus this system (paired 95 % CI) | "Backed" → humans agree | Human-supported items it backs | False conflicts on human-supported | Skip (Backed) | Errors kept in the "check" pile | Random flagging, same amount | Errors named as "May conflict" | "May conflict" → not supported |
|---|---|---|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, as shipped) | 55.2% [51.6%–58.4%] | — | 68.2% (n=22) | 13.0% | 1.7% | 5.9% | 97.3% | 94.1% | 7.3% | 90.5% (n=21) |
| plain checker (top sentence + raw NLI label) | 54.9% [51.8%–57.8%] | 0.3 pts [-2.0, 2.8] | 76.5% (n=17) | 11.3% | 9.6% | 4.5% | 98.5% | 95.5% | 19.6% | 82.3% (n=62) |

"Errors kept in the check pile" = share of human-unsupported items that are not marked Backed. Flagging the same share of items at random would keep that share of errors (last column).

## E4 — beyond biographies: the whole app path on original FEVER claims (SPEC §12)
### E4 — the app's whole path on original FEVER claims beyond biographies (Symmetric FEVER dev+test originals, FEVER labels, shipped settings, run once) — 355 items, 355 topics, 58.6% not supported by humans

| System | Balanced accuracy [95 % CI] | Receipts minus this system (paired 95 % CI) | "Backed" → humans agree | Human-supported items it backs | False conflicts on human-supported | Skip (Backed) | Errors kept in the "check" pile | Random flagging, same amount | Errors named as "May conflict" | "May conflict" → not supported |
|---|---|---|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, as shipped) | 75.5% [70.6%–79.3%] | — | 89.1% (n=92) | 55.8% | 5.4% | 25.9% | 95.2% | 74.1% | 28.4% | 88.1% (n=67) |
| plain checker (top sentence + raw NLI label) | 68.4% [63.5%–72.0%] | 7.0 pts [4.6, 9.5] | 84.9% (n=73) | 42.2% | 18.4% | 20.6% | 94.7% | 79.4% | 70.7% | 84.5% (n=174) |

"Errors kept in the check pile" = share of human-unsupported items that are not marked Backed. Flagging the same share of items at random would keep that share of errors (last column).

## Slowed-laptop timing
```
{
 "cpuSlowdown": 4,
 "coldWithDownload": {
  "sample": "Eiffel Tower",
  "firstClaimS": 21.2,
  "allS": 44.4,
  "summary": "3 of 4 claims backed",
  "claims": 4
 },
 "warmCached": {
  "sample": "Julia Faye",
  "firstClaimS": 37.9,
  "allS": 65.9,
  "summary": "2 of 11 claims backed",
  "claims": 6
 },
 "when": "2026-10-05T18:11:14.272Z",
 "note": "fresh profile; network = this machine’s connection; laptop CPU slowed with Emulation.setCPUThrottlingRate"
}
```

## Triage view (share you can skip vs errors left in the "check" pile)
### Triage view — fresh held-out PerplexityAI (v2 run; code before the v3 bug fixes) — 1253 items, 35 topics, 15.7% not supported by humans

| System | Balanced accuracy [95 % CI] | Receipts minus this system (paired 95 % CI) | "Backed" → humans agree | Human-supported items it backs | False conflicts on human-supported | Skip (Backed) | Errors kept in the "check" pile | Random flagging, same amount | Errors named as "May conflict" | "May conflict" → not supported |
|---|---|---|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, as shipped) | 70.7% [67.1%–74.1%] | — | 94.1% (n=698) | 62.2% | 3.6% | 55.7% | 79.2% | 44.3% | 6.1% | 24.0% (n=50) |
| plain checker (top sentence + raw NLI label) | 66.6% [63.2%–70.0%] | 4.1 pts [1.9, 6.4] | 94.3% (n=548) | 49.0% | 12.9% | 43.7% | 84.3% | 56.3% | 25.4% | 26.9% (n=186) |

"Errors kept in the check pile" = share of human-unsupported items that are not marked Backed. Flagging the same share of items at random would keep that share of errors (last column).

### Triage view — ChatGPT test topics (seen in v1; code before the v3 bug fixes) — 2774 items, 89 topics, 37.0% not supported by humans

| System | Balanced accuracy [95 % CI] | Receipts minus this system (paired 95 % CI) | "Backed" → humans agree | Human-supported items it backs | False conflicts on human-supported | Skip (Backed) | Errors kept in the "check" pile | Random flagging, same amount | Errors named as "May conflict" | "May conflict" → not supported |
|---|---|---|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, as shipped) | 72.4% [70.2%–74.4%] | — | 85.2% (n=1307) | 63.7% | 3.5% | 47.1% | 81.1% | 52.9% | 8.5% | 58.8% (n=148) |
| plain checker (top sentence + raw NLI label) | 67.1% [64.9%–68.8%] | 5.3 pts [4.1, 6.7] | 85.9% (n=964) | 47.4% | 11.9% | 34.8% | 86.8% | 65.2% | 26.2% | 56.4% (n=477) |

"Errors kept in the check pile" = share of human-unsupported items that are not marked Backed. Flagging the same share of items at random would keep that share of errors (last column).

### PerplexityAI held-out, only the 5 people NOT in the ChatGPT test topics (small n) — 118 items, 5 topics, 25.4% not supported by humans

| System | Balanced accuracy [95 % CI] | Receipts minus this system (paired 95 % CI) | "Backed" → humans agree | Human-supported items it backs | False conflicts on human-supported | Skip (Backed) | Errors kept in the "check" pile | Random flagging, same amount | Errors named as "May conflict" | "May conflict" → not supported |
|---|---|---|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, as shipped) | 66.7% [44.8%–77.7%] | — | 89.8% (n=49) | 50.0% | 5.7% | 41.5% | 83.3% | 58.5% | 10.0% | 37.5% (n=8) |
| plain checker (top sentence + raw NLI label) | 62.1% [53.2%–72.3%] | 4.5 pts [-9.3, 8.0] | 87.8% (n=41) | 40.9% | 15.9% | 34.7% | 83.3% | 65.3% | 36.7% | 44.0% (n=25) |

"Errors kept in the check pile" = share of human-unsupported items that are not marked Backed. Flagging the same share of items at random would keep that share of errors (last column).

## Revision 2 — component ablation

### Fresh held-out: PerplexityAI test topics — 1253 facts, 35 topics

| System | Balanced accuracy | Δ vs plain checker (paired 95 % CI) | False conflicts on human-supported facts | Unsupported facts caught as "May conflict" |
|---|---|---|---|---|
| Receipts v2 (all components) | 70.7% | 4.1 pts [1.9, 6.4] | 3.6% | 6.1% |
| − similarity gate | 70.7% | 4.1 pts [1.9, 6.4] | 3.6% | 6.1% |
| − subject rule | 70.3% | 3.7 pts [1.5, 6.2] | 4.6% | 6.6% |
| − conflict only from the top sentence | 66.7% | 0.0 pts [-2.8, 2.5] | 23.2% | 31.0% |
| − strict thresholds (0.6 / 0.6) | 70.6% | 4.0 pts [1.5, 6.6] | 5.3% | 8.6% |
| plain checker | 66.6% | — | 12.9% | 25.4% |

### ChatGPT test topics (seen in v1) — 2774 facts, 89 topics

| System | Balanced accuracy | Δ vs plain checker (paired 95 % CI) | False conflicts on human-supported facts | Unsupported facts caught as "May conflict" |
|---|---|---|---|---|
| Receipts v2 (all components) | 72.4% | 5.3 pts [4.0, 6.7] | 3.5% | 8.5% |
| − similarity gate | 72.3% | 5.2 pts [4.0, 6.6] | 3.5% | 8.6% |
| − subject rule | 72.6% | 5.5 pts [4.2, 6.9] | 4.2% | 9.2% |
| − conflict only from the top sentence | 68.0% | 0.9 pts [-0.5, 2.6] | 23.1% | 29.0% |
| − strict thresholds (0.6 / 0.6) | 72.1% | 5.0 pts [3.7, 6.5] | 5.4% | 12.4% |
| plain checker | 67.1% | — | 11.9% | 26.2% |

Reading: most of the gain on real answers comes from the asymmetric decision rule (support may come from any of the top five sentences, a conflict only from the single most relevant one, above 0.97). The similarity gate matters mainly when the evidence is about something else (E1, stress test). The price: few real errors are caught as "May conflict".

## Revision 2 selection (dev)
Plain checker on dev: balanced 68.7%, Backed precision 88.3%, conflict precision 56.5% (n=200), false conflicts on supported 13.2%.
Rule met: all of (a)(b)(c); 3535 of 7680 settings qualify.
Chosen: gate {"minSimilarity":0.3,"minSharedTokens":0,"ignoreTopicTokens":false}, thresholds {"entail":0.7,"contradict":0.97,"contradictNeedsSubject":true,"entailNeedsSubject":false,"conflictFromTopOnly":true,"disagreement":"contradicted"}
Dev: balanced 73.2%, Backed precision 85.9%, conflict precision 59.7% (n=77), false conflicts on supported 4.7%.

## E-fresh — PerplexityAI biographies, 40 hash-chosen test topics (v2, single run)
Settings frozen on dev: gate {"minSimilarity":0.3,"minSharedTokens":0,"ignoreTopicTokens":false}, thresholds {"entail":0.7,"contradict":0.97,"contradictNeedsSubject":true,"entailNeedsSubject":false,"conflictFromTopOnly":true,"disagreement":"contradicted"}. Intervals: 95 % bootstrap over topics (1,000 resamples).

### All test topics — 1253 facts, 35 topics, 15.7% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, frozen on dev) | 70.7% [67.1%–74.1%] | 94.1% [91.4%–96.4%] (n=698) | 24.0% [9.5%–37.9%] (n=50) | 3.6% [2.4%–5.1%] | 4 | 44.3% | 53.7% (81.4%) |
| same thresholds, gate OFF | 70.3% [66.6%–73.7%] | 94.1% [91.4%–96.3%] (n=690) | 21.0% [9.4%–34.6%] (n=62) | 4.6% [3.5%–5.8%] | 18 | 44.9% | 53.1% (81.4%) |
| plain checker (top sentence + raw NLI label) | 66.6% [63.2%–70.0%] | 94.3% [91.2%–96.9%] (n=548) | 26.9% [15.6%–37.6%] (n=186) | 12.9% [10.6%–15.7%] | 43 | 56.3% | 42.2% (81.4%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (81.4%) |

### Without the topics used as UI samples during development (Julia Faye, Carlos Santana, Marianne McAndrew) — 1180 facts, 33 topics, 15.2% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, frozen on dev) | 69.9% [65.2%–73.2%] | 93.9% [91.1%–96.3%] (n=668) | 22.9% [9.6%–37.3%] (n=48) | 3.7% [2.5%–5.1%] | 4 | 43.4% | 54.5% (81.9%) |
| same thresholds, gate OFF | 69.5% [65.0%–72.9%] | 93.8% [91.0%–96.2%] (n=660) | 20.0% [8.2%–33.3%] (n=60) | 4.8% [3.7%–6.0%] | 18 | 44.1% | 54.0% (81.9%) |
| plain checker (top sentence + raw NLI label) | 65.8% [62.1%–69.5%] | 94.0% [91.2%–96.5%] (n=521) | 25.3% [13.7%–36.9%] (n=174) | 13.0% [10.5%–15.8%] | 40 | 55.8% | 42.6% (81.9%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (81.9%) |

### Stress test — evidence only from other pages (as if the subject had no article of their own) — 1253 facts, 35 topics, 15.7% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, frozen on dev) | 57.4% [54.5%–60.1%] | 93.2% [89.4%–96.7%] (n=278) | 31.6% [12.0%–50.0%] (n=19) | 1.2% [0.5%–2.0%] | 0 | 77.8% | 20.2% (81.4%) |
| same thresholds, gate OFF | 57.3% [54.3%–59.8%] | 93.1% [89.3%–96.6%] (n=274) | 27.8% [12.5%–44.4%] (n=54) | 3.7% [2.8%–4.8%] | 37 | 78.1% | 19.9% (81.4%) |
| plain checker (top sentence + raw NLI label) | 57.0% [54.4%–59.5%] | 93.6% [89.8%–97.1%] (n=249) | 24.2% [10.5%–38.1%] (n=124) | 8.9% [7.1%–10.9%] | 89 | 80.1% | 18.3% (81.4%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (81.4%) |

### Calibration (is a higher "backs" score more often right?)

| Highest "backs" score among gated sentences | Facts | Humans: supported |
|---|---|---|
| 0.0–0.2 | 437 | 69.3% |
| 0.2–0.4 | 48 | 81.3% |
| 0.4–0.6 | 38 | 71.1% |
| 0.6–0.8 | 36 | 88.9% |
| 0.8–0.9 | 44 | 88.6% |
| 0.9–1.0 | 650 | 94.8% |

## E2 — ChatGPT biographies, test topics
**v2 settings (re-scored; these topics were seen in the v1 run):**
Settings frozen on dev: gate {"minSimilarity":0.3,"minSharedTokens":0,"ignoreTopicTokens":false}, thresholds {"entail":0.7,"contradict":0.97,"contradictNeedsSubject":true,"entailNeedsSubject":false,"conflictFromTopOnly":true,"disagreement":"contradicted"}. Intervals: 95 % bootstrap over topics (1,000 resamples).

### All test topics — 2774 facts, 89 topics, 37.0% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, frozen on dev) | 72.4% [70.2%–74.5%] | 85.2% [80.9%–88.6%] (n=1307) | 58.8% [48.3%–69.9%] (n=148) | 3.5% [2.5%–4.4%] | 4 | 52.9% | 45.1% (60.1%) |
| same thresholds, gate OFF | 72.5% [70.2%–74.6%] | 85.4% [81.1%–88.9%] (n=1298) | 56.2% [46.5%–66.7%] (n=169) | 4.2% [3.1%–5.4%] | 31 | 53.2% | 44.8% (60.1%) |
| plain checker (top sentence + raw NLI label) | 67.1% [64.9%–68.8%] | 85.9% [80.8%–89.4%] (n=964) | 56.4% [49.8%–64.9%] (n=477) | 11.9% [10.1%–13.7%] | 107 | 65.2% | 33.3% (60.1%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (60.1%) |

### Without the topics used as UI samples during development (Julia Faye, Carlos Santana, Marianne McAndrew) — 2715 facts, 87 topics, 37.2% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, frozen on dev) | 72.5% [70.2%–74.6%] | 85.3% [80.5%–88.9%] (n=1271) | 59.2% [49.7%–70.9%] (n=147) | 3.5% [2.5%–4.4%] | 4 | 53.2% | 44.7% (59.9%) |
| same thresholds, gate OFF | 72.6% [70.2%–74.8%] | 85.5% [80.6%–89.1%] (n=1262) | 56.9% [47.6%–68.5%] (n=167) | 4.2% [3.1%–5.4%] | 30 | 53.5% | 44.4% (59.9%) |
| plain checker (top sentence + raw NLI label) | 67.2% [65.0%–69.0%] | 86.0% [80.5%–89.5%] (n=938) | 56.6% [50.7%–65.5%] (n=465) | 11.8% [9.9%–13.3%] | 105 | 65.5% | 33.0% (59.9%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (59.9%) |

### Stress test — evidence only from other pages (as if the subject had no article of their own) — 2774 facts, 89 topics, 37.0% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, frozen on dev) | 56.0% [54.0%–58.2%] | 77.8% [69.3%–84.6%] (n=519) | 51.3% [31.8%–70.3%] (n=39) | 1.1% [0.6%–1.6%] | 0 | 81.3% | 17.4% (60.1%) |
| same thresholds, gate OFF | 56.0% [54.0%–58.3%] | 78.1% [69.2%–85.2%] (n=515) | 49.6% [39.7%–61.1%] (n=117) | 3.4% [2.2%–4.4%] | 79 | 81.4% | 17.3% (60.1%) |
| plain checker (top sentence + raw NLI label) | 55.8% [54.0%–57.8%] | 80.0% [70.7%–86.6%] (n=444) | 51.0% [43.4%–60.3%] (n=304) | 8.5% [6.7%–10.3%] | 216 | 84.0% | 14.9% (60.1%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (60.1%) |

### Calibration (is a higher "backs" score more often right?)

| Highest "backs" score among gated sentences | Facts | Humans: supported |
|---|---|---|
| 0.0–0.2 | 1215 | 38.6% |
| 0.2–0.4 | 93 | 67.7% |
| 0.4–0.6 | 83 | 61.4% |
| 0.6–0.8 | 91 | 69.2% |
| 0.8–0.9 | 106 | 73.6% |
| 0.9–1.0 | 1186 | 86.3% |

**v1 settings (the original single held-out run):**
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

## E-full — the app's whole path on raw ChatGPT answers (sentence level, 40 hash-chosen test topics, v2)
Our splitter and topic guess, no hints. A sentence counts as "supported" only if every human atomic fact in it is supported, and
as "Backed" only if every part we split it into is backed — strict on both sides.
Settings frozen on dev: gate {"minSimilarity":0.3,"minSharedTokens":0,"ignoreTopicTokens":false}, thresholds {"entail":0.7,"contradict":0.97,"contradictNeedsSubject":true,"entailNeedsSubject":false,"conflictFromTopOnly":true,"disagreement":"contradicted"}. Intervals: 95 % bootstrap over topics (1,000 resamples).

### All test topics — 292 facts, 40 topics, 58.2% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, frozen on dev) | 57.1% [53.5%–60.9%] | 80.8% [65.5%–94.3%] (n=26) | 63.2% [44.4%–86.4%] (n=19) | 5.7% [1.9%–9.9%] | 0 | 91.1% | 8.5% (40.3%) |
| same thresholds, gate OFF | 57.1% [53.5%–60.9%] | 80.8% [65.5%–94.3%] (n=26) | 63.2% [41.7%–82.4%] (n=19) | 5.7% [2.5%–9.4%] | 2 | 91.1% | 8.5% (40.3%) |
| plain checker (top sentence + raw NLI label) | 56.9% [53.4%–60.7%] | 86.4% [73.9%–100.0%] (n=22) | 70.0% [54.2%–83.8%] (n=40) | 9.8% [5.3%–15.0%] | 5 | 92.5% | 7.2% (40.3%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (40.3%) |

### Without the topics used as UI samples during development (Julia Faye, Carlos Santana, Marianne McAndrew) — 279 facts, 38 topics, 58.1% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, frozen on dev) | 56.6% [53.0%–60.1%] | 79.2% [62.5%–93.8%] (n=24) | 63.2% [42.9%–86.7%] (n=19) | 6.0% [1.7%–10.8%] | 0 | 91.4% | 8.2% (40.5%) |
| same thresholds, gate OFF | 56.6% [53.0%–60.1%] | 79.2% [62.5%–93.8%] (n=24) | 63.2% [41.2%–83.3%] (n=19) | 6.0% [2.5%–9.8%] | 2 | 91.4% | 8.2% (40.5%) |
| plain checker (top sentence + raw NLI label) | 56.3% [53.1%–60.3%] | 85.0% [71.4%–100.0%] (n=20) | 67.6% [51.4%–82.9%] (n=37) | 10.3% [5.1%–15.6%] | 5 | 92.8% | 6.8% (40.5%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (40.5%) |

### Stress test — evidence only from other pages (as if the subject had no article of their own) — 292 facts, 40 topics, 58.2% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, frozen on dev) | 50.0% [50.0%–50.0%] | — | 100.0% [100.0%–100.0%] (n=3) | 0.0% [0.0%–0.0%] | 0 | 100.0% | 0.0% (40.3%) |
| same thresholds, gate OFF | 50.0% [50.0%–50.0%] | — | 77.8% [50.0%–100.0%] (n=9) | 1.6% [0.0%–4.4%] | 6 | 100.0% | 0.0% (40.3%) |
| plain checker (top sentence + raw NLI label) | 50.0% [50.0%–50.0%] | — | 70.6% [44.4%–92.3%] (n=17) | 4.1% [1.0%–7.9%] | 10 | 100.0% | 0.0% (40.3%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (40.3%) |

## E1 — Unrelated sentences (Symmetric FEVER v0.2, 712 test pairs, Schuster et al. 2019)
Each claim with its real evidence, and with another pair's evidence (a different subject). Same model outputs, four decision rules.
**nli-deberta-v3-xsmall (shipped)**

| Setting | Real evidence: correct | Coverage (not "no receipt") | Correct when decided | SUPPORTS → backed | REFUTES → conflict | Unrelated sentence → "no receipt" | Unrelated → "conflict" |
|---|---|---|---|---|---|---|---|
| Receipts as shipped (gate + web/config.json thresholds) | 388/712 = 54.5% [50.8%–58.1%] | 398/712 = 55.9% [52.2%–59.5%] | 388/398 = 97.5% [95.4%–98.6%] | 213/356 = 59.8% [54.7%–64.8%] | 175/356 = 49.2% [44.0%–54.3%] | 707/712 = 99.3% [98.4%–99.7%] | 2/712 = 0.3% [0.1%–1.0%] |
| shipped thresholds, gate OFF | 471/712 = 66.2% [62.6%–69.5%] | 492/712 = 69.1% [65.6%–72.4%] | 471/492 = 95.7% [93.6%–97.2%] | 215/356 = 60.4% [55.2%–65.3%] | 256/356 = 71.9% [67.0%–76.3%] | 366/712 = 51.4% [47.7%–55.1%] | 343/712 = 48.2% [44.5%–51.8%] |
| gate ON, plain 0.6/0.6 thresholds | 514/712 = 72.2% [68.8%–75.4%] | 564/712 = 79.2% [76.1%–82.0%] | 514/564 = 91.1% [88.5%–93.2%] | 215/356 = 60.4% [55.2%–65.3%] | 299/356 = 84.0% [79.8%–87.4%] | 705/712 = 99.0% [98.0%–99.5%] | 4/712 = 0.6% [0.2%–1.4%] |
| plain checker: raw NLI label, no gate | 538/712 = 75.6% [72.3%–78.6%] | 602/712 = 84.6% [81.7%–87.0%] | 538/602 = 89.4% [86.7%–91.6%] | 220/356 = 61.8% [56.6%–66.7%] | 318/356 = 89.3% [85.7%–92.1%] | 180/712 = 25.3% [22.2%–28.6%] | 529/712 = 74.3% [71.0%–77.4%] |

- Claim-only cue baseline (negation word → refutes): 356/712 = 50.0% [46.3%–53.7%] — the symmetric set is built so the claim alone carries no signal (a property of the data set, not of our model).
- "Unrelated" = the evidence sentence of the pair 356 rows away (a different subject). This is the easy case; hard, same-topic cases are measured in E2 on real labels (false conflicts on human-supported facts).
- Runtime: 23 s (batched inference, laptop CPU).

**DeBERTa-v3-base-mnli-fever-anli (larger, 244 MB vs 87 MB)**

| Setting | Real evidence: correct | Coverage (not "no receipt") | Correct when decided | SUPPORTS → backed | REFUTES → conflict | Unrelated sentence → "no receipt" | Unrelated → "conflict" |
|---|---|---|---|---|---|---|---|
| Receipts as shipped (gate + web/config.json thresholds) | 256/712 = 36.0% [32.5%–39.5%] | 283/712 = 39.7% [36.2%–43.4%] | 256/283 = 90.5% [86.5%–93.4%] | 243/356 = 68.3% [63.3%–72.9%] | 13/356 = 3.7% [2.1%–6.1%] | 708/712 = 99.4% [98.6%–99.8%] | 0/712 = 0.0% [0.0%–0.5%] |
| shipped thresholds, gate OFF | 264/712 = 37.1% [33.6%–40.7%] | 291/712 = 40.9% [37.3%–44.5%] | 264/291 = 90.7% [86.8%–93.5%] | 246/356 = 69.1% [64.1%–73.7%] | 18/356 = 5.1% [3.2%–7.9%] | 707/712 = 99.3% [98.4%–99.7%] | 1/712 = 0.1% [0.0%–0.8%] |
| gate ON, plain 0.6/0.6 thresholds | 426/712 = 59.8% [56.2%–63.4%] | 472/712 = 66.3% [62.7%–69.7%] | 426/472 = 90.3% [87.2%–92.6%] | 252/356 = 70.8% [65.9%–75.3%] | 174/356 = 48.9% [43.7%–54.1%] | 705/712 = 99.0% [98.0%–99.5%] | 3/712 = 0.4% [0.1%–1.2%] |
| plain checker: raw NLI label, no gate | 466/712 = 65.4% [61.9%–68.9%] | 533/712 = 74.9% [71.5%–77.9%] | 466/533 = 87.4% [84.3%–90.0%] | 266/356 = 74.7% [70.0%–79.0%] | 200/356 = 56.2% [51.0%–61.2%] | 637/712 = 89.5% [87.0%–91.5%] | 64/712 = 9.0% [7.1%–11.3%] |

- Claim-only cue baseline (negation word → refutes): 356/712 = 50.0% [46.3%–53.7%] — the symmetric set is built so the claim alone carries no signal (a property of the data set, not of our model).
- "Unrelated" = the evidence sentence of the pair 356 rows away (a different subject). This is the easy case; hard, same-topic cases are measured in E2 on real labels (false conflicts on human-supported facts).
- Runtime: 57 s (batched inference, laptop CPU).

## E3 — InstructGPT biographies (30 test topics in file order; seen in v1, re-scored with v2)
Settings frozen on dev: gate {"minSimilarity":0.3,"minSharedTokens":0,"ignoreTopicTokens":false}, thresholds {"entail":0.7,"contradict":0.97,"contradictNeedsSubject":true,"entailNeedsSubject":false,"conflictFromTopOnly":true,"disagreement":"contradicted"}. Intervals: 95 % bootstrap over topics (1,000 resamples).

### All test topics — 594 facts, 30 topics, 85.0% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, frozen on dev) | 74.1% [67.2%–83.0%] | 40.3% [25.0%–58.5%] (n=144) | 98.4% [94.4%–100.0%] (n=62) | 1.1% [0.0%–3.5%] | 4 | 75.8% | 22.9% (15.1%) |
| same thresholds, gate OFF | 74.3% [67.4%–83.2%] | 40.8% [25.5%–58.8%] (n=142) | 98.4% [94.4%–100.0%] (n=61) | 1.1% [0.0%–3.5%] | 14 | 76.1% | 22.7% (15.1%) |
| plain checker (top sentence + raw NLI label) | 71.4% [66.6%–77.5%] | 44.1% [27.6%–61.4%] (n=111) | 97.8% [94.4%–100.0%] (n=180) | 4.5% [0.0%–10.8%] | 52 | 81.3% | 18.2% (15.1%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (15.1%) |

### Without the topics used as UI samples during development (Julia Faye, Carlos Santana, Marianne McAndrew) — 594 facts, 30 topics, 85.0% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, frozen on dev) | 74.1% [67.2%–83.0%] | 40.3% [25.0%–58.5%] (n=144) | 98.4% [94.4%–100.0%] (n=62) | 1.1% [0.0%–3.5%] | 4 | 75.8% | 22.9% (15.1%) |
| same thresholds, gate OFF | 74.3% [67.4%–83.2%] | 40.8% [25.5%–58.8%] (n=142) | 98.4% [94.4%–100.0%] (n=61) | 1.1% [0.0%–3.5%] | 14 | 76.1% | 22.7% (15.1%) |
| plain checker (top sentence + raw NLI label) | 71.4% [66.6%–77.5%] | 44.1% [27.6%–61.4%] (n=111) | 97.8% [94.4%–100.0%] (n=180) | 4.5% [0.0%–10.8%] | 52 | 81.3% | 18.2% (15.1%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (15.1%) |

### Stress test — evidence only from other pages (as if the subject had no article of their own) — 594 facts, 30 topics, 85.0% of facts not supported by humans

| System | Balanced accuracy | "Backed" → humans agree | "May conflict" → humans: not supported | False conflicts on human-supported facts | Conflicts resting on a sentence about someone/something else | Share flagged | Est. supported (human) |
|---|---|---|---|---|---|---|---|
| Receipts (v2 settings, frozen on dev) | 54.1% [49.4%–60.6%] | 21.7% [10.7%–40.8%] (n=92) | 90.0% [72.7%–100.0%] (n=20) | 2.2% [0.0%–6.3%] | 1 | 84.5% | 14.3% (15.1%) |
| same thresholds, gate OFF | 54.3% [49.7%–60.8%] | 22.2% [11.0%–41.3%] (n=90) | 97.7% [92.3%–100.0%] (n=43) | 1.1% [0.0%–4.1%] | 30 | 84.8% | 14.1% (15.1%) |
| plain checker (top sentence + raw NLI label) | 54.7% [50.9%–60.3%] | 24.7% [12.9%–42.6%] (n=73) | 93.8% [88.3%–98.1%] (n=144) | 10.1% [4.2%–20.0%] | 106 | 87.7% | 11.6% (15.1%) |
| flag everything | 50.0% | — | — | 0.0% | 0 | 100.0% | 0.0% (15.1%) |

### Calibration (is a higher "backs" score more often right?)

| Highest "backs" score among gated sentences | Facts | Humans: supported |
|---|---|---|
| 0.0–0.2 | 420 | 6.0% |
| 0.2–0.4 | 11 | 18.2% |
| 0.4–0.6 | 9 | 22.2% |
| 0.6–0.8 | 13 | 23.1% |
| 0.8–0.9 | 11 | 9.1% |
| 0.9–1.0 | 130 | 43.1% |

## What I did not do
- No model training or fine-tuning; thresholds and gate settings are the only tuned numbers.
- No labels of my own: all labels come from the datasets' authors.
- No user study. The claims about students are a design goal, not a measured outcome.
