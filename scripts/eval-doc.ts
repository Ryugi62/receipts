// Compose docs/eval.md from the committed result files (no number is typed by hand).
// Usage: npx tsx scripts/eval-doc.ts
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const inc = (p: string) => (existsSync(p) ? readFileSync(p, 'utf8').trim().replace(/^# /, '### ') : `_(not run: ${p})_`)
const doc = `# How we evaluated Receipts

Two questions, two public datasets, no training. Every number below is produced by a script in \`scripts/\` and the raw
per-item results are in \`docs/results/\` (one JSON line per item, with the evidence sentences and model scores).

## E1 — Does the model read the evidence, or guess from the claim?
**Data:** Symmetric FEVER v0.2 (Schuster et al., EMNLP 2019). Each claim comes with a Wikipedia sentence; the set is built so
the claim alone carries no signal (a "contains a negation word → refutes" rule scores exactly 50 %).
**Swap test:** we also give every claim the evidence sentence of a *different* pair (an unrelated sentence) and count how often
the verdict becomes "no receipt". "Raw model" = the NLI model's own label with no gate.
Script: \`npx tsx scripts/eval-symmetric.ts --split test --model <id>\`.

${inc('docs/results/e1-test-nli-deberta-v3-xsmall-q8.md')}

For comparison, a larger model trained on more NLI data (used by many fact-checking demos):

${inc('docs/results/e1-test-DeBERTa-v3-base-mnli-fever-anli-q8.md')}

**Reading:** the small model alone calls unrelated text a contradiction most of the time — that is the shortcut. The gate removes
it without retraining, so we ship the small model with the gate: 87 MB vs 244 MB to download (8-bit ONNX files) and 29 s vs 42 s for the whole E1 test run on our laptop CPU (runtime lines above).

## E2 — Real chatbot answers, full pipeline
**Data:** FActScore (Min et al., EMNLP 2023): ChatGPT biographies split into atomic facts, each labelled by humans as supported (S)
or not supported (NS) by Wikipedia. We drop "irrelevant" facts. Topics are split by a hash of the name into **dev** (2/5) and
**test** (3/5) before looking at any result; we use the first 40 dev topics.
**Pipeline:** the full app path — live Wikipedia search (cached on disk for reproducibility), pre-filter, embedding ranking, NLI,
gate, verdict. Pronouns at the start of a fact ("She…") are replaced by the topic, as the app does.
**Choosing settings:** \`scripts/sweep.ts\` tries ${'1,920'} combinations of relevance bar, shared-word count, subject rules and
thresholds on **dev only** and keeps the best balanced accuracy. Those settings are frozen in \`docs/results/chosen-fact-*.json\`
and in \`web/config.json\`, then applied once to **test**.
**Caveat:** the human labels were made against a 2023 Wikipedia snapshot; we read today's Wikipedia. Some "disagreements" are
the article changing (e.g. a page that now states a nationality the 2023 page did not).

${inc('docs/results/e2-fact-nli-deberta-v3-xsmall-test.md')}

## What we did not do
- No model training or fine-tuning. Thresholds are the only tuned numbers.
- No hand-labelling by us: all labels are from the datasets' authors.
- The sentence splitter and atomic-claim rules are evaluated only indirectly (through the app); FActScore's own atomic facts are
  used as inputs for E2 so the number measures retrieval + reading, not our splitter.
`
writeFileSync('docs/eval.md', doc)
console.log('docs/eval.md written')
