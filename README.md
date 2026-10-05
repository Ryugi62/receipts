# Receipts — ask an AI answer for its receipts

Paste an answer from any AI chatbot. Receipts splits it into small claims, finds the Wikipedia sentence that could back
each one, and a language-inference model **running in your browser** marks every claim
**Backed**, **Contradicted** or **No receipt** — always showing the sentence it relied on.

**Live:** https://ryugi62.github.io/receipts/ · no account, no API key · built for the
[ML Empowerment Build Challenge 3.0](https://ml-build-challenge-3.devpost.com/)

<!-- NUMBERS -->

## Why
Students paste AI answers into homework every day. Chatbots sound sure even when a date or a name is wrong, and checking
every sentence by hand is slow, so most people don't. Receipts does the boring part — it finds the one sentence on
Wikipedia that backs or contradicts each claim — and leaves the judgement to you.

## The shortcut we had to beat
Natural-language-inference models (the kind that decide whether sentence A supports sentence B) have a known shortcut.
Given a sentence about something **unrelated**, many of them answer "contradiction". A naive fact-checker built on them
tells you a true fact is false. Receipts puts a **relevance gate** in front of the model — the evidence sentence must be
close in meaning, share a real word with the claim, and be about the same subject — and we measured that the gate removes
the shortcut instead of hiding it. Try the **Swap test** button on any claim: we feed the claim an unrelated sentence, show
what the raw model says, and show that Receipts answers "no receipt".

## How it works
1. **Split** the answer into sentences, resolve "he/she/it" to the topic, and break long sentences into atomic parts
   (birth–death dates, "X was a Y who Z", ", and <verb> …") with simple, tested rules.
2. **Retrieve**: search Wikipedia for the topic and for each claim (MediaWiki API, only the claim text is sent), keep the
   prose, drop reference sections.
3. **Rank**: a cheap word-overlap pre-filter keeps 40 sentences, then `all-MiniLM-L6-v2` embeddings pick the top 5.
4. **Infer**: `nli-deberta-v3-xsmall` (ONNX, transformers.js, in the browser) scores backs / contradicts / neutral.
5. **Gate + decide**: only gated sentences may decide; contradiction needs a sentence about the same subject; sources that
   disagree are shown side by side.

No training anywhere — pretrained models only. The only tuned numbers (relevance bar and two thresholds) were chosen on
development topics and frozen before the held-out run.

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
npm run eval:fs  -- --split dev  --model Xenova/nli-deberta-v3-xsmall   # then: npx tsx scripts/sweep.ts --apply test
```

## Limits (read this)
- Wikipedia is not the truth, and **"no receipt" does not mean false** — it means "check this one yourself".
- English only. Works best for people, places, events and other things with a Wikipedia article.
- The splitter is rule-based; unusual sentences are checked whole, which often ends in "no receipt".
- The human labels we evaluate against (FActScore) were made against a 2023 Wikipedia snapshot; the app reads today's
  Wikipedia, so some disagreements are the article changing, not the model.

## Data and credits
- Symmetric FEVER v0.2 — Schuster et al., *Towards Debiasing Fact Verification Models*, EMNLP 2019 (CC BY-SA 3.0).
- FActScore labelled ChatGPT biographies — Min et al., *FActScore*, EMNLP 2023 (MIT).
- Models: `Xenova/nli-deberta-v3-xsmall` (from cross-encoder/nli-deberta-v3-xsmall), `Xenova/all-MiniLM-L6-v2`.
- Text from Wikipedia (CC BY-SA). Built solo during the challenge with an AI coding assistant; MIT licence.
