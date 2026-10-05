// Compose docs/eval.md from the committed result files (no number is typed by hand).
// Usage: npx tsx scripts/eval-doc.ts
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const inc = (p: string) => (existsSync(p) ? readFileSync(p, 'utf8').trim().replace(/^# .*\n/, '') : `_(not run: ${p})_`)
const doc = `# How I evaluated Receipts

Three questions, public human-labelled data, no training. Every number below is produced by a script in \`scripts/\`; per-item
results (evidence sentences and model scores) are in \`docs/results/\`. The Wikipedia pages used are published as a release asset
(\`wiki-cache.tar.gz\`) so the runs can be repeated on the same text.

## Protocol (what was fixed when)
1. Dev/test split of FActScore topics by a hash of the name, decided before any result (2/5 dev, 3/5 test). I ran the first 40 of
   the 68 dev topics (1,133 facts) to save time.
2. Selection rule (SPEC §7) written before the final dev run and before any test run: on dev, keep settings with "Backed"
   precision ≥ 85 % and "May conflict" precision ≥ 80 %, pick the best balanced accuracy; ship the smaller model unless the
   larger one is ≥ 3 points better. No setting reached the 80 % conflict floor, so the relaxed rule (Backed ≥ 85 %) applied, and
   the small model was kept (71.3 % vs 71.7 %).
3. Settings frozen in \`web/config.json\` (commit "freeze settings … before the held-out test run"), then one test run.
4. Disclosure: three biographies (Julia Faye, Carlos Santana, Marianne McAndrew) are UI samples I looked at while building — the
   subject rule was motivated by a Julia Faye sentence. Two of them fall in the test split, so every test table is also shown
   without them.
5. After the test run I added two things that were not tuned on test: batching (speed only) and skipping Wikipedia
   "(disambiguation)" pages. The cross-generator run (E3) used that final code.

## E1 — Does it read the evidence? (Symmetric FEVER v0.2, 712 test pairs)
Each claim is checked with its real evidence sentence, and again with an **unrelated** sentence (another pair's evidence). Same
model outputs, four decision rules. The small model on its own ("plain checker") calls the unrelated sentence a contradiction
most of the time; even at the shipped 0.97 threshold, turning the gate off lets about half of them through as conflicts. With the
gate: zero.

**nli-deberta-v3-xsmall (shipped)**
${inc('docs/results/e1-test-nli-deberta-v3-xsmall-q8.md')}

**DeBERTa-v3-base-mnli-fever-anli (larger, 244 MB vs 87 MB)**
${inc('docs/results/e1-test-DeBERTa-v3-base-mnli-fever-anli-q8.md')}

What the gate costs: on this set it also drops many genuine refutations (the subject rule is strict), so coverage falls. That is
the trade I chose for a tool that tells students "this may be wrong" — a false alarm about a true fact is the costly error.

## E2 — Real ChatGPT answers (FActScore, Min et al., EMNLP 2023)
Human-written atomic facts from ChatGPT biographies, each labelled supported / not supported against Wikipedia. Pipeline from
retrieval onward: live Wikipedia search (disk-cached), pre-filter, embedding ranking, NLI, gate, verdict. The app's own sentence
splitter is not used here (the human atomic facts are the inputs), so this measures retrieval + reading.
Labels were made on 2023 Wikipedia; the pipeline reads today's, so some "errors" are the article changing.

${inc('docs/results/e2-fact-test-nli-deberta-v3-xsmall.report.md')}

Dev (used for choosing — optimistic by construction):
${inc('docs/results/e2-fact-dev-nli-deberta-v3-xsmall.report.md')}

## E3 — Does it carry over to another chatbot? (FActScore InstructGPT biographies, test topics, same frozen settings)
${inc('docs/results/e2-fact-test-nli-deberta-v3-xsmall-InstructGPT.report.md')}

## What I did not do
- No model training or fine-tuning; thresholds and gate settings are the only tuned numbers.
- No labels of my own: all labels come from the datasets' authors.
- No user study yet. The claims about students are a design goal, not a measured outcome.
`
writeFileSync('docs/eval.md', doc)
console.log('docs/eval.md written')
