# Decision Log

## 2026-08-06 — Reimagination is the active product direction

- **Decision:** Treat the owner-supplied product vision, pillars, anti-pillars, technical foundation, and attached studio brief as the active direction for this repository.
- **Reason:** The owner explicitly commissioned ANOTHERVERSE REIMAGINED under those constraints.
- **Reversible:** Yes. No legacy files or commits exist in this repository.

## 2026-08-06 — Phase 0 is a clean reset

- **Decision:** Record no reusable or quarantined implementation because the local `Secondverse` repository is empty and `main` has no commits.
- **Reuse:** Product thesis and technical constraints only.
- **Quarantine:** The former campaign compiler and prose-heavy campaign direction conceptually; no code is present here.
- **One-sentence gate:** We reuse the deterministic-browser-game contract and rebuild the playable core; we do not continue the former campaign/prose product.

## 2026-08-06 — Implementation waits at the taste gate

- **Decision:** Do not create a feature branch or production code until the owner selects or revises the combat presentation target.
- **Reason:** Battle rhythm, information density, and spectacle materially define the game’s identity and are explicitly owner-owned in the studio brief.

## 2026-08-06 — Hybrid combat presentation approved

- **Decision:** Use Tactical Theatre clarity during ordinary action and Volatile Chorus motion only for signature triggers and decisive moments.
- **Owner wording:** “Hybrid, remember, learn from our mistakes, no bombastic vocabulary for this game.”
- **Language rule:** Use plain, concrete mechanical names and short human phrasing. Do not use grandiose lore compounds, inflated titles, or decorative vocabulary to make ordinary mechanics sound important.
- **Learning rule:** Failed hypotheses, confusing labels, dominant plans, and removed approaches stay in the decision and playtest logs so later work does not silently repeat them.
- **Reversible:** Timing and emphasis values are tuning data; the clarity-first hierarchy is product authority.

## 2026-08-06 — Stop content expansion at the first encounter-pair gate

- **Decision:** Do not add encounters three and four until the owner plays the complete first pair and the observation is recorded.
- **Reason:** The studio brief requires a playtest after every encounter pair, and automated correctness cannot establish enjoyment or desire to continue.
- **Evidence ready:** typecheck/build pass, Vitest 56/56, Playwright 19/19, normal playback 70.2 seconds.
- **Reversible:** If the human gate passes, the next pair can begin immediately with a new one-risk iteration packet.

## 2026-08-07 — Owner Playtest 01 revises hero ownership before content expansion

- **Decision:** Rate the whole prototype **REVISE — functional but flat** after Owner Playtest 01. Do not treat green automated gates as proof that the loop is compelling.
- **Keep:** The autobattler direction and visible preparation-to-battle causality. The owner said, “This is good, it's more autobattler, lets keep it that way.”
- **Learn:** The current visuals are mixed; preparation feels like fixed damage, tank, and support roles; Bruised was not noticed because the log felt overwhelming; desire to replay was unclear.
- **Direction:** Generated recruit and collection excitement remains the intended product direction. The owner said, “The initial roadmap of an almost gacha excitement type of new heroes to collect is definitely the way to go.”
- **Next gate:** Before generated candidates, give each authored hero one unique two-option stance with a visible forecast and distinct authoritative battle effects. This tests player ownership with the smallest playable change.
- **Presentation rule:** Record stable hooks for later art, animation, flying numbers, skill effects, debuffs, and statuses, but do not claim final visual quality or begin broad asset production in this iteration.
- **Scope rule:** Do not add generated roster, recruit economy, new encounters, campaign, currencies, final art, or broad injury systems until the stance gate is evaluated.
- **Reversible:** The authored stances are a test bed. Their typed ownership pattern may later feed generated hero traits, but their exact effects can be revised or removed based on playtest evidence.

## 2026-08-07 — Stance implementation passes automation; human gate remains

- **Decision:** Keep the completed per-hero stance/readability implementation for Owner Playtest 02. Do not change the whole-prototype verdict from **REVISE — functional but flat** on automated evidence alone.
- **Evidence:** Production build and typecheck passed; Vitest 73/73 passed; Playwright 24/24 passed; normal playback took 71.8 seconds; no console, page, or network failures occurred; independent QA found no P0–P2 defect.
- **Automated verdict:** KEEP for the bounded iteration.
- **Human gate:** The player must state all three chosen stances, predict one concrete effect for each, notice at least two stance triggers without the inspector, explain one changed battle outcome, identify one hero they deliberately shaped, notice Bruised before Punish, and rate both the visuals and desire to replay.
- **Evidence rule:** Record the Owner Playtest 02 answers without inferring success from implementation or automated checks.
- **Scope gate:** Generated candidates and encounters three and four remain gated until the human stance result is recorded and evaluated.
- **Reversible:** Individual stance rules and presentation can still be revised after the human observation; no broader content depends on treating this gate as passed.

## 2026-08-08 — Owner Playtest 02 keeps the stance foundation and revises playback

- **Decision:** Keep the improved visual direction and per-hero stance mechanics as a foundation, but rate the human stance/readability gate failed and keep the whole prototype **REVISE — functional but flat**.
- **Human evidence:** Only Ada's stance was noticed. Changing a stance did not visibly read amid the event density. Healer single-target versus area healing was the clearest differentiation while the other identities stayed generic. Bruised was missed again, playback felt too fast, and the owner did not want another attempt.
- **Session count:** Owner Playtests 01 and 02 used the same tester, so fresh human sessions remain **1/5**.
- **Next iteration:** Key Moments Playback will leave authoritative combat unchanged, group typed causal chains into a small set of readable plays or highlights, compress routine facts, hold longer for stance, enemy-rule, break, and defeat moments, replace ordinary event churn with a concise moment summary, and make Bruised part of the encounter-two start decision.
- **Human gate:** Without the inspector, the owner must notice at least two of three stance activations, explain one stance-caused outcome, notice Bruised before Punish, and say the pacing is readable.
- **Scope rule:** Exclude final sprites, generated roster, encounters three and four, simulation rebalance, and campaign. Generated candidates remain gated.
- **Reversible:** Playback grouping, summary density, and hold timing may change without changing authoritative battle events or results.

## 2026-08-08 — Key Moments passes automation; Owner Playtest 03 remains the gate

- **Decision:** Keep the completed Key Moments Playback implementation for human testing. Mark the bounded result **KEEP automated; HUMAN REQUIRED** and keep the whole prototype **REVISE — functional but flat**.
- **Evidence:** Typecheck passed; Vitest 86/86 passed; production build passed with 151 modules; full Playwright passed 27/27 in 2.2 minutes; focused Key Moments passed 3/3; normal Key moments took 39.8 seconds inside the 35–75 second target.
- **Compression evidence:** The captured battle presented 28 key moments while preserving 279 raw events and the same authoritative outcome.
- **Quality evidence:** Independent QA found no P0–P2 source defect and no console, page, network, layout, or fallback issue.
- **Human gate:** without Exact events, owner notices at least 2 of 3 chosen stance activations, explains one stance-caused outcome, notices Bruised before Punish, and rates pacing readable.
- **Evidence rule:** Owner Playtest 03 is not yet run. Do not infer human notice, comprehension, pacing, enjoyment, or replay desire from the automated KEEP.
- **Scope rule:** Final sprites, generated candidates, and encounters three and four remain gated until Owner Playtest 03 is recorded and evaluated.
- **Reversible:** Moment selection, compression, and hold timing can still be revised without changing authoritative battle events or results.

## 2026-08-08 — Owner Playtest 03 keeps Key Moments with a live-notice limitation

- **Decision:** Keep Key Moments with a limitation. Pacing is acceptable, and the key report or aftermath explanation is sufficient at this stage. Live stance and Bruised notice did not pass and are not claimed solved for fresh players.
- **Owner evidence:** “Honestly, I still can't tell, there's too much going on but I don't think a normal player will notice it within, but on the key report. so I think if key moments is working it's good enough”
- **Session rule:** Owner Playtests 01, 02, and 03 used the same tester. Fresh sessions remain **1/5**, and the Phase 2 five-session exit has not passed.
- **Authorization:** The owner explicitly authorizes concurrent plain-language repair and a generated-candidate draft lab.
- **Next iteration:** Seeded Candidate Draft Lab will present three deterministic, compatibility-checked candidates with plain mechanical comparison, favorite selection, reroll or new seed, mechanical fingerprints, duplicate rejection, concise grammar rules, and current-loop text repair. Candidates remain comparison-only and are not fieldable.
- **Human gate:** The player states why each candidate differs, chooses one for a mechanical or build reason, identifies one risk or tradeoff, and voluntarily requests another roster.
- **Automated gate:** Same-seed equality, named RNG streams, runtime schema validation, 100-seed semantic diversity with no duplicates, browser selection and reroll accessibility, and grammar assertions.
- **Scope rule:** Exclude combat integration, final art, campaign, currencies, broad biographies, arbitrary fragment prose, and encounters three and four.
- **Reversible:** Candidate generation and comparison can be revised or removed without changing authored combat or making candidates fieldable.

## 2026-08-08 — Candidate lab passes automation; human draft gate remains

- **Decision:** Keep the completed Seeded Candidate Draft Lab and concurrent plain-language repair for owner testing. Mark the automated result **KEEP**, but keep the iteration **IN PROGRESS — READY FOR OWNER PLAYTEST**.
- **Evidence:** Candidate-focused Playwright passed 3/3; final full Playwright passed 30/30 in 2.2 minutes; normal playback took 39.6 seconds; Vitest passed 98/98; strict typecheck and the 160-module production build passed; authoritative generation and simulation contain no `Math.random`.
- **Diversity evidence:** The final 100-seed handoff generated 100/100 valid sets and 300 candidates with 298 semantic fingerprints, 36 core builds, minimum semantic distance 3, 93% multi-chassis sets, full required content coverage, and average 1.07 / maximum 2 retries.
- **QA learning:** A duplicate display name appeared within one set even though the builds differed. Exclude already-used identity IDs before the identity RNG stream chooses. This fixes player-facing ambiguity without coupling cosmetic identity to mechanics.
- **Presentation decision:** Keep the fixed mobile favorite-status punctuation. Carry mobile comparison scroll density as P2 playtest evidence rather than hiding it behind the green browser gate.
- **Human gate:** The owner must state why each candidate differs, explain a favorite choice, identify one risk or tradeoff, and voluntarily request a new set. Automated checks cannot answer these questions.
- **Gate rule:** Fresh sessions remain 1/5 and the Phase 2 gate has not passed. Candidates remain comparison-only and not fieldable; combat integration stays gated.
- **Reversible:** Candidate content, generation weights, and comparison presentation may change after the owner playtest without changing authored combat.

## 2026-08-08 — Candidate Draft Lab passes its human gate

- **Decision:** Mark the bounded Seeded Candidate Draft Lab **KEEP**. The owner distinguished meaningful stat, advantage, technique, and numerical variance; chose a basic-attack and technique-point ramping combination for a mechanical reason; identified persistent Strain after Guard as a meaningful risk; and voluntarily requested a new set.
- **Product learning:** The draw is finding a rare combination whose rules work together, not merely seeing a new name. Preserve semantic combinations and understandable risks as the center of candidate discovery.
- **Reroll boundary:** Unlimited **Show new candidates** use is a lab-only affordance. Do not add rarity weights, recruitment prices, or a currency until the run loop supplies a real source and sink.
- **Session rule:** This was the same owner as the prior playtests. Fresh human sessions remain 1/5, and the Phase 2 exit has not passed.
- **Next iteration:** Record and then build only the smallest Single-Candidate Combat Trial. One selected generated hero enters a controlled fight so card promises can be judged as executable rules.
- **Trial gate:** The owner names at least two candidate rules that activated, connects one to a numerical or status outcome, and says whether they would recruit the candidate.
- **Scope rule:** Exclude full campaign roster replacement, currency/economy, large content expansion, and an art batch.
- **Automated rule:** Protect deterministic replay, exact structured trigger events, one semantic fixture, battle termination, and truthful UI copy.
- **Current result:** PENDING. The iteration packet exists before source implementation; no implementation result is claimed.
- **Reversible:** The controlled fixture can be revised without committing the campaign roster or economy to a wider recruitment design.

## 2026-08-08 — Single-Candidate Combat Trial passes automation

- **Decision:** Keep the controlled candidate battle implementation for owner testing. Mark the bounded result **AUTOMATED KEEP — READY FOR OWNER PLAYTEST**; do not begin full roster replacement or recruitment economy yet.
- **Combat boundary:** A selected candidate joins two fixed training partners against three fixed opponents. This exercises generated rules without changing the authored Ada/Bo/Cy battle engine or claiming campaign integration.
- **Presentation decision:** Keep battlefield-first playback, flying exact deltas, a live Signature/Advantage/Risk tracker, and a concise result report. The complete event list stays closed by default.
- **QA learning:** A live rule moment originally included unrelated changes that occurred before the next highlight. Rule summaries now follow only typed causal descendants. Measured Combo reports only its Points gain; Shared Strain retains only its Strain and directly caused Broken chain.
- **Evidence:** Typecheck and 172-module build passed; Vitest 115/115 passed; focused candidate-trial Playwright 3/3 and final full Playwright 33/33 passed; 36/36 core builds and 300/300 sampled candidates terminated; independent QA found no remaining P0–P3 issue; the mobile activation ribbon intersects 0/6 fighter cards.
- **Human gate:** The owner names at least two candidate rules that activated, connects one to a numerical or status outcome, and says whether they would recruit that candidate.
- **Economy rule:** Unlimited new candidates remain a lab affordance. Rarity and recruitment cost wait for a run with a real source and sink.
- **Reversible:** The fixed training fixture, profile conversions, playback timing, and presentation can be tuned without committing the campaign roster or economy.
