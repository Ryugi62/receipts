# Revision 2 selection on ChatGPT dev (1133 facts) — SPEC §9
Plain checker on dev: balanced 68.7%, Backed precision 88.3%, conflict precision 56.5% (n=200), false conflicts on supported 13.2%.
Rule met: all of (a)(b)(c); 3535 of 7680 settings qualify.
Chosen: gate {"minSimilarity":0.3,"minSharedTokens":0,"ignoreTopicTokens":false}, thresholds {"entail":0.7,"contradict":0.97,"contradictNeedsSubject":true,"entailNeedsSubject":false,"conflictFromTopOnly":true,"disagreement":"contradicted"}
Dev: balanced 73.2%, Backed precision 85.9%, conflict precision 59.7% (n=77), false conflicts on supported 4.7%.
