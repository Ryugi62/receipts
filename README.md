# Receipts — ask an AI answer for its receipts

Paste an answer from any AI chatbot. Receipts splits it into small claims, finds the Wikipedia sentence that could back
each one, and a language-inference model **running in your browser** marks every claim
**Backed**, **May conflict** or **No receipt** — always showing the sentence it relied on.

**Live:** https://ryugi62.github.io/receipts/ · no account, no API key · built for the
[ML Empowerment Build Challenge 3.0](https://ml-build-challenge-3.devpost.com/)

<!-- NUMBERS -->
- On a **held-out set** of chatbot answers with human labels (FActScore, PerplexityAI biographies, 1,253 facts; new answers, though 30 of the 35 people also appear in earlier test topics), Receipts raises a false "may conflict" on true facts **3.6%** of the time, vs **12.9%** for a simpler top-sentence checker — mostly thanks to one rule: only the single most relevant sentence may raise a conflict.
- Use it as a filter: on the same set it marks **55.7%** of facts Backed (94.1% of those are right), and **79.2%** of the facts humans could not support stay in the "check yourself" pile — skipping the same share at random would keep 44.3%. Balanced accuracy 70.7% vs 66.6%; settings were frozen on separate development topics before this run.
- Beyond biographies — the app's whole path on 355 FEVER claims (films, places, science, sport…): balanced accuracy **75.5%** vs 68.4% for the simpler checker, false "may conflict" on true claims 5.4% vs 18.4%; when it says "May conflict" it is right 88.1% of the time.
- Limits: on whole raw paragraphs through the app it ties the simpler checker (55.2% vs 54.9%, 375 sentences) and backs only 13.0% of the sentences humans support. It rarely names the mistake itself: "May conflict" is a hint to read the sentence, not a verdict.
- Easy synthetic test: given an **unrelated** sentence, the small model on its own calls it a contradiction **74.3%** of the time, 48.2% with our thresholds but no gate, and Receipts **0.3%** (712 pairs, Symmetric FEVER).
- Full method, baselines, intervals and misses: [docs/eval.md](docs/eval.md)
<!-- /NUMBERS -->

## Why
About a quarter of U.S. teens (26 %, up from 13 % a year earlier) say they have used ChatGPT for schoolwork, and 54 % say it
is fine to use it to research new topics ([Pew Research Center, 2025-01-15](https://www.pewresearch.org/short-reads/2025/01/15/about-a-quarter-of-us-teens-have-used-chatgpt-for-schoolwork-double-the-share-in-2023/)).
Chatbots sound sure even when a date or a name is wrong, and checking every sentence by hand is slow, so most people don't. Receipts does the boring part — it finds the one sentence on
Wikipedia that backs or contradicts each claim — and leaves the judgement to you.

## The failure I had to beat
Small natural-language-inference models (the kind that decide whether sentence A supports sentence B) are over-confident on
sentences that are **not about the claim**: they often call them a "contradiction". A plain fact-checker built on them tells you
a true fact is false — my first version said Julia Faye's death date was contradicted by a sentence about her father.
Two rules fix most of it, and the evaluation shows which does what:
- **Asymmetric evidence:** any good sentence may back a claim, but only the single most relevant one may raise a conflict.
  On real chatbot answers this is where the gain comes from (false conflicts on true facts 3.6 % vs 12.9 % for a plain checker).
- **Relevance gate:** a sentence must be close in meaning, and a conflict must be about the same subject. It matters when the
  evidence is about something else (unrelated sentences: 48.2 % called a conflict without it, 0.3 % with it).
The price: Receipts rarely catches a mistake by itself; it tells you which claims are backed and which to check.
When a plain "top sentence + raw model" checker would have answered differently, the app shows that answer and why.

For teachers: a 15-minute classroom activity built on the app — [docs/classroom.md](docs/classroom.md).

## Related work, and what is different here
Checking claims against Wikipedia with an inference model is an established research setup: FEVER (Thorne et al., 2018),
FActScore (Min et al., 2023, whose labels I evaluate against), SummaC / AlignScore-style consistency checkers. Receipts does not
claim a new model. What it adds: (1) it runs entirely in a student's browser with no key, account or server; (2) an **asymmetric
decision rule** — any good sentence may back a claim, only the single most relevant one may raise a conflict — measured to cut
false "this is wrong" calls on true facts from 12.9 % to 3.6 % on held-out answers; (3) it shows what a plain checker would have
said and why it was set aside; (4) it turns "no receipt" into a next step (a cited draft, or a question back to the chatbot).

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
6. **What now?** Copy the answer with a Wikipedia footnote on every backed sentence and a visible `[check: …]` on the rest, or
   copy a follow-up question that asks the chatbot for a checkable source for each claim Receipts could not back.

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
- The splitter is rule-based; unusual sentences are checked whole, which often ends in "no receipt". On whole raw sentences
  through the app (fresh check H1, 375 sentences) it is no better than the plain checker (55.2 % vs 54.9 %) and backs only 13 % of
  the sentences humans support. Two pre-registered fixes (cleaner evidence text, reading 10 sentences instead of 5) did not
  clear their bar on dev and were not shipped (SPEC §11).
- The human labels I evaluate against (FActScore) were made against a 2023 Wikipedia snapshot; the app reads today's
  Wikipedia, so some disagreements are the article changing, not the model.

## Data and credits
- Symmetric FEVER v0.2 — Schuster et al., *Towards Debiasing Fact Verification Models*, EMNLP 2019 (CC BY-SA 3.0).
- FActScore labelled ChatGPT / InstructGPT / PerplexityAI biographies — Min et al., *FActScore*, EMNLP 2023 (MIT).
- Models: `Xenova/nli-deberta-v3-xsmall` (from cross-encoder/nli-deberta-v3-xsmall), `Xenova/all-MiniLM-L6-v2`.
- Text from Wikipedia (CC BY-SA). Built solo during the challenge (first commit 2026-10-05) with an AI coding assistant;
  MIT licence.
