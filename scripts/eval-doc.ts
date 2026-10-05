// Compose docs/eval.md: every table is included from docs/results; the short version quotes those tables.
// Usage: npx tsx scripts/eval-doc.ts
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const inc = (p: string) => (existsSync(p) ? readFileSync(p, 'utf8').trim().replace(/^# .*\n/, '') : `_(not run: ${p})_`)
const doc = `# How I evaluated Receipts

Public, human-labelled data; no training; every table below is produced by a script in \`scripts/\`, and per-item results
(evidence sentences and model scores) are in \`docs/results/\`. Wikipedia text used: release asset \`wiki-cache.tar.gz\` (v0.1).
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
- **Revision 4 missed its bar too** (SPEC §13): a richer rule-based splitter for whole paragraphs (role lists, "including A, B
  and C", ", where he…", "born on…") gained +0.3 points on dev sentences against a +2.0 bar, so it is off by default.
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
${inc('docs/results/v3-selection.md')}

${inc('docs/results/v3-selection-topk.md')}

${inc('docs/results/h1-report.md')}

## E4 — beyond biographies: the whole app path on original FEVER claims (SPEC §12)
${inc('docs/results/e4-report.md')}

## Slowed-laptop timing
\`\`\`
${existsSync('docs/results/slow-laptop-4x.json') ? readFileSync('docs/results/slow-laptop-4x.json', 'utf8').trim() : ''}
\`\`\`

## Revision 4 — splitter for whole paragraphs (dev only; not shipped)
${inc('docs/results/v4-dev-split4.md')}

${inc('docs/results/v4-dev-split0.md')}

## Triage view (share you can skip vs errors left in the "check" pile)
${inc('docs/results/triage-perplexity.md')}

${inc('docs/results/triage-chatgpt.md')}

${inc('docs/results/perplexity-nonoverlap.md')}

## Revision 2 — component ablation
${inc('docs/results/ablation-v2.md')}

## Revision 2 selection (dev)
${inc('docs/results/v2-selection.md')}

## E-fresh — PerplexityAI biographies, 40 hash-chosen test topics (v2, single run)
${inc('docs/results/e2-fact-test-nli-deberta-v3-xsmall-PerplexityAI-v2.report.md')}

## E2 — ChatGPT biographies, test topics
**v2 settings (re-scored; these topics were seen in the v1 run):**
${inc('docs/results/e2-fact-test-nli-deberta-v3-xsmall-v2-seen.report.md')}

**v1 settings (the original single held-out run):**
${inc('docs/results/e2-fact-test-nli-deberta-v3-xsmall.report.md')}

## E-full — the app's whole path on raw ChatGPT answers (sentence level, 40 hash-chosen test topics, v2)
Our splitter and topic guess, no hints. A sentence counts as "supported" only if every human atomic fact in it is supported, and
as "Backed" only if every part we split it into is backed — strict on both sides.
${inc('docs/results/e2-sentence-test-nli-deberta-v3-xsmall-v2.report.md')}

## E1 — Unrelated sentences (Symmetric FEVER v0.2, 712 test pairs, Schuster et al. 2019)
Each claim with its real evidence, and with another pair's evidence (a different subject). Same model outputs, four decision rules.
**nli-deberta-v3-xsmall (shipped)**
${inc('docs/results/e1-test-nli-deberta-v3-xsmall-q8.md')}

**DeBERTa-v3-base-mnli-fever-anli (larger, 244 MB vs 87 MB)**
${inc('docs/results/e1-test-DeBERTa-v3-base-mnli-fever-anli-q8.md')}

## E3 — InstructGPT biographies (30 test topics in file order; seen in v1, re-scored with v2)
${inc('docs/results/e2-fact-test-nli-deberta-v3-xsmall-InstructGPT-v2-seen.report.md')}

## What I did not do
- No model training or fine-tuning; thresholds and gate settings are the only tuned numbers.
- No labels of my own: all labels come from the datasets' authors.
- No user study. The claims about students are a design goal, not a measured outcome.
`
writeFileSync('docs/eval.md', doc)
console.log('docs/eval.md written')
