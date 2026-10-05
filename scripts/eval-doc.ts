// Compose docs/eval.md: every table is included from docs/results; the short version quotes those tables.
// Usage: npx tsx scripts/eval-doc.ts
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const inc = (p: string) => (existsSync(p) ? readFileSync(p, 'utf8').trim().replace(/^# .*\n/, '') : `_(not run: ${p})_`)
const doc = `# How I evaluated Receipts

Public, human-labelled data; no training; every table below is produced by a script in \`scripts/\`, and per-item results
(evidence sentences and model scores) are in \`docs/results/\`. Wikipedia text used: release asset \`wiki-cache.tar.gz\` (v0.1).
"Plain checker" = the obvious baseline: take the most relevant sentence and the NLI model's raw label, no gate, no thresholds.

## The short version
- **Fresh held-out set (PerplexityAI biographies, 1,253 facts, never run before the settings were frozen):** balanced accuracy
  **70.7 %** vs 66.6 % for the plain checker; when Receipts says **Backed**, humans agree **94.1 %**; false "May conflict" on
  facts humans found true **3.6 %** vs **12.9 %** for the plain checker.
- **ChatGPT test topics (2,774 facts; seen once with v1, re-scored with v2 — labelled as such):** 72.4 % vs 67.1 %; false
  conflicts 3.5 % vs 11.9 %.
- **Unrelated sentences (Symmetric FEVER, 712 pairs):** the small model alone calls them a contradiction 74.3 % of the time;
  Receipts 0.3 %. Switching only the gate off brings it back to 48.2 %.
- **Misses, stated plainly:** on whole sentences from raw answers (the app's own splitter and topic guess) Receipts backs few
  sentences (balanced accuracy 57.1 %, tied with the plain checker); "May conflict" is only a hint (24–63 % precision depending
  on the set); v1 missed my 70 % target on its held-out run (68.0 %), which is why revision 2 exists.

## History and protocol
1. FActScore topics split by a hash of the name into dev (2/5) and test (3/5) before any result.
2. **v1** (SPEC §7): settings chosen on 40 ChatGPT dev topics, frozen, one test run → 68.0 %, a tie with the plain checker and
   worse on false conflicts (13.9 % vs 11.9 %). Reported below unchanged.
3. **v2** (SPEC §9, pushed to GitHub before running it): two decision options — a conflict may only come from the most relevant
   gated sentence; disagreeing sources may abstain — and a selection rule that requires beating the plain checker on false
   conflicts and conflict precision **on dev**. Then one run on a **fresh** set (PerplexityAI, 40 hash-chosen test topics).
4. Disclosure: Julia Faye, Carlos Santana and Marianne McAndrew are UI samples I looked at while building; each table is also
   shown without them. Post-freeze code changes (batching; skipping "(disambiguation)" pages; dropping pronunciation
   parentheses) were not tuned on any test data; the PerplexityAI and sentence-level runs used the final code.
5. The count "conflicts resting on a sentence about someone else" uses the gate's own subject rule, so it is circular for
   Receipts; it is kept in the tables for the baselines only and is not used as evidence.

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
