# UPPCS PYQ practice review — 8 November 2026

The original collection contains 1,200 questions. At the owner's request the promotional slide keeps that original collection number. Available test counts use the actual retained questions.

- Content-review scope: 1,054 non-Current-Affairs questions across 17 tests.
- Current Affairs: all 146 questions retained unchanged, excluded from content review.
- Removed: 97 questions with ambiguous/missing keys, disputed interpretations, or unresolved factual verification. Removal is deliberately conservative; it does not assert that every removed question is false.
- Available: 957 non-current questions plus 146 Current Affairs questions = 1,103.
- Retained questions with correction records: 548. Changes include translation, terminology, options, explanations, answer keys, and explicit matching data; this is not a count of factual mistakes.
- Matching is stored as two explicit four-entry lists in both languages. It no longer depends solely on guessing table boundaries from flattened text.
- The scoring denominator excludes questions without a usable key. Non-current tests now contain no such questions. Saved progress uses a content revision to avoid reusing answers against a changed question sequence.

## Scope and limits

This is an editorial language/consistency review with selective primary-source checks, not certification of every question against the original final examination key. English stems/options/explanations and matching content were reviewed; automated structural checks cover the full retained bank. Not every Hindi explanatory sentence or historical claim was independently source-verified. Questions may be reworded for practice clarity, so these are edited practice versions rather than facsimiles of original papers.

Browser visual verification could not finish: Computer Use stopped because it could not reliably determine the browser URL. No claim of a completed mobile visual check is made. Python is unavailable locally, so the original markdown rebuild was not executed; the published HTML and its JavaScript are validated directly.

## Verification

Run `node tools/pyq-content-audit.cjs` from the repository root. It checks all 19 tests, compiles their inline scripts, verifies actual counts, both language fields, four distinct options in non-current questions, explicit matching cell counts, exclusions, unchanged Current Affairs content, and four result-calculation scenarios. The Current Affairs comparison uses the base Git revision supplied with `PYQ_AUDIT_BASE` (default `52b4357`).

`uppcs-prelims-pyq-corrections.json` preserves overrides using original file/local question IDs. `uppcs-prelims-pyq-exclusions.json` preserves removed IDs and reasons. The markdown builder applies both after assigning the original per-part IDs, before computing counts. Do not renumber the source IDs before applying exclusions.

## Selected sources consulted

These support selected corrections or decisions; they do not establish whole-bank verification.

- [UNDP Human Development Report 2021–22](https://hdr.undp.org/system/files/documents/global-report-document/hdr2021-22reportenglish_0.pdf): publication year versus data year and country order.
- [Constitution of India, Legislative Department](https://www.legislative.gov.in/static/uploads/2025/07/88cca69e868e50b217f855be2fb8bdba.pdf): constitutional articles and schedules.
- [First Finance Commission terms of reference](https://fincomindia.nic.in/asset/doc/commission-reports/1st-FC/tor_1st.pdf): constitution date.
- [National Population Policy, Ministry of Health](https://mohfw.gov.in/sites/default/files/97384291631433497431.pdf): population-stabilisation target.
- [PLFS July–September 2022, MoSPI](https://www.mospi.gov.in/sites/default/files/publication_reports/QuarterlyBulletinPLFSJulySeptember2022RPTN.pdf): urban current-weekly-status unemployment.
- [WHO arsenic fact sheet](https://www.who.int/news-room/fact-sheets/detail/arsenic): multiple valid country options in an excluded question.
- [WHO dengue questions and answers](https://www.who.int/news-room/questions-and-answers/item/dengue-and-severe-dengue): overlapping mosquito-vector options.
- [CDC Haemophilus influenzae surveillance chapter](https://cdc.gov/surv-manual/php/table-of-contents/chapter-2-haemophilus-influenzae.html): multiple valid disease options.
- [US EPA acid rain](https://www.epa.gov/acidrain/what-acid-rain): ordinary rain acidity versus pollution-related acid rain.
- [US EIA biomass glossary](https://www.eia.gov/tools/glossary/index.php?id=Biomass): fossil fuel and nuclear energy are not biomass.
- [IPCC AR6, chapter 11](https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/): frequency versus intensity and regional uncertainty.
- [Samaspur Ramsar information sheet](https://rsis.ramsar.org/RISapp/files/RISrep/IN2415RIS_2002_en.pdf): location.
- [Nobel Prize graphene explanation](https://www.nobelprize.org/prizes/physics/2010/speedread/): isolation in 2004.
- [ICAR Indian Agriculture after Independence](https://www.icar.gov.in/sites/default/files/2023-02/Indian-Agriculture-after-Independence.pdf): wheat ear-cockle nematode, recorded before removing the originally unscored item.
