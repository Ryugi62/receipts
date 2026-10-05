# Receipts — ask an AI answer for its receipts

Paste an answer from any AI chatbot. Receipts splits it into small claims, finds the Wikipedia sentence that could back
each one, and a language-inference model **running in your browser** marks every claim
**Backed**, **May conflict** or **No receipt** — always showing the sentence it relied on.

**Live:** https://ryugi62.github.io/receipts/ · no account, no API key · built for the
[ML Empowerment Build Challenge 3.0](https://ml-build-challenge-3.devpost.com/)

<!-- NUMBERS -->
- Given an **unrelated** sentence, the small model on its own calls it a contradiction **74.3%** of the time; Receipts: **0.3%** (712 pairs, Symmetric FEVER).
- On a **fresh held-out set** of chatbot answers with human labels (FActScore, PerplexityAI biographies, 1,253 facts): when Receipts says **Backed**, humans agree **94.1%**; it raises a false "may conflict" on true facts **3.6%** of the time, vs **12.9%** for a simpler top-sentence checker.
- Balanced accuracy 70.7% vs 66.6% for that simpler checker. Settings were chosen on separate development topics and frozen before this run.
- Limits: "No receipt" is common (about half of all facts), and "May conflict" is a hint to read the sentence, not a verdict.
- Full method, baselines, intervals and misses: [docs/eval.md](docs/eval.md)
<!-- /NUMBERS -->

## Why
Students paste AI answers into homework every day. Chatbots sound sure even when a date or a name is wrong, and checking
every sentence by hand is slow, so most people don't. Receipts does the boring part — it finds the one sentence on
Wikipedia that backs or contradicts each claim — and leaves the judgement to you.

## The failure I had to beat
Small natural-language-inference models (the kind that decide whether sentence A supports sentence B) are over-confident on
sentences that are **not about the claim**: they often call them a "contradiction". A plain fact-checker built on them tells you
a true fact is false — my first version said Julia Faye's death date was contradicted by a sentence about her father.
Receipts puts a **relevance gate** in front of the model: an evidence sentence may decide only if it is close in meaning to the
claim, and a conflict may only come from the single most relevant sentence and only if it is about the same subject. When a plain "top sentence + raw
model" checker would have answered differently, the app shows that answer and why the sentence was set aside.

## How it works
1. **Split** the answer into sentences, resolve "he/she/it" to the topic, and break long sentences into atomic parts
   (birth–death dates, "X was a Y who Z", ", and <verb> …") with simple, tested rules.
2. **Retrieve**: search Wikipedia for the topic and for each claim (MediaWiki API — each claim's text is sent as a search,
   never the whole answer at once), keep the prose, drop reference sections and disambiguation pages.
3. **Rank**: a cheap word-overlap pre-filter keeps 40 sentences, then `all-MiniLM-L6-v2` embeddings pick the top 5.
4. **Infer**: `nli-deberta-v3-xsmall` (8-bit ONNX, transformers.js, in the browser, one batched pass) scores backs /
   contradicts / neutral.
5. **Gate + decide**: only gated sentences may decide; a conflict must come from the single most relevant gated sentence and
   be about the same subject; sources that disagree are shown side by side.

No training anywhere — pretrained models only. The only tuned numbers (relevance bar, two thresholds, subject rules) were
chosen on development topics with rules pushed before each run (SPEC §7, §9), and frozen before the held-out runs.

```
src/domain        claims, gate, verdict   (pure, no I/O)
src/application   checkAnswer use case + ports (EvidenceSource, Ranker, NliModel)
src/adapters      Wikipedia, transformers.js NLI + embeddings
web/ · scripts/   UI, evaluation, captures   (infrastructure)
```
`npm run layers` fails on any reverse import.

## Run it
```
npm ci
npm test            # unit tests
npm run dev         # http://127.0.0.1:5173
npm run eval:sym -- --split test --model Xenova/nli-deberta-v3-xsmall
npm run eval:fs  -- --split dev  --model Xenova/nli-deberta-v3-xsmall   # then: npx tsx scripts/sweep.ts
npx tsx scripts/e2-report.ts --split test                                 # baselines, ablation, bootstrap intervals
```

## Limits (read this)
- Wikipedia is not the truth, and **"no receipt" does not mean false** — it means "check this one yourself".
- "May conflict" is a prompt to read the sentence, not a verdict: its precision ranged from 24 % to 63 % across the held-out
  sets. Many true facts still get "No receipt" — the tool is cautious, and on whole raw sentences it backs few (docs/eval.md, E-full).
- English only. Works best for people, places, events and other things with a Wikipedia article.
- The splitter is rule-based; unusual sentences are checked whole, which often ends in "no receipt".
- The human labels I evaluate against (FActScore) were made against a 2023 Wikipedia snapshot; the app reads today's
  Wikipedia, so some disagreements are the article changing, not the model.

## Data and credits
- Symmetric FEVER v0.2 — Schuster et al., *Towards Debiasing Fact Verification Models*, EMNLP 2019 (CC BY-SA 3.0).
- FActScore labelled ChatGPT / InstructGPT / PerplexityAI biographies — Min et al., *FActScore*, EMNLP 2023 (MIT).
- Models: `Xenova/nli-deberta-v3-xsmall` (from cross-encoder/nli-deberta-v3-xsmall), `Xenova/all-MiniLM-L6-v2`.
- Text from Wikipedia (CC BY-SA). Built solo during the challenge (first commit 2026-10-05) with an AI coding assistant;
  MIT licence.
