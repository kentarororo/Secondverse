# Studio State

**Updated:** 2026-08-08
**Phase:** 2 — Combat Laboratory  
**Repository:** Branch `codex/reimagine-core-loop`; baseline HEAD `01cf834`; current iteration uncommitted.
**Status:** Candidate discovery KEEP; candidate trial human REVISE; Main-loop Presentation Consolidation AUTOMATED KEEP — READY FOR OWNER PLAYTEST; whole prototype REVISE; fresh sessions remain 1/5

## Highest-risk unanswered player-experience question

Will the clearer candidate-trial battle and report hierarchy make the real two-encounter loop easier to understand without adding a mandatory trial before recruitment?

## Completed iteration — First Encounter Pair Foundation

- **Player problem:** The product specifies systems and outcomes but does not yet define a battle presentation whose decisive interactions are exciting and readable at normal speed.
- **Falsifiable hypothesis:** If the battlefield emphasizes anticipation, named actions, spatially legible targets, sharp impacts, and a short decisive slowdown, players will identify the turning point without using a full log and will choose another fight.
- **Playable scope after approval:** One browser arena, one authored trio, two counterposed enemy encounters, one formation choice, one team policy, one per-hero policy, deterministic 45–90 second battles, and a concise result screen.
- **Explicit exclusions:** Generated roster, campaign, routes, crafting, currencies, procedural prose, save migration, multiple arenas, meta progression, and broad content production.
- **Human success criteria:** The owner enjoys a battle at normal speed; 4/5 fresh players identify why it was won or lost; 4/5 change a plan after an enemy tell; 3/5 voluntarily choose replay/next fight; nobody needs the full event log for the decisive moment.
- **Automated protection:** Strict typecheck; deterministic replay equality; no `Math.random` in authoritative code; unit coverage for formation/policy/targeting; browser coverage for the complete prepare–battle–result journey.
- **Result:** REVISE — planning leverage works, but impact readability is below gate and mobile preparation overlaps one control.
- **Evidence:** Default plan wins after 55 actions; Ada middle plus Cover rear wins after 39 actions and makes the interception the typed turning point. Browser gate: 8 passed, 2 meaningful acceptance failures. Focused scores: comprehension 3, planning 3, readability 2, presentation 2, stability/accessibility/performance 3.
- **Next highest-risk question:** Can a fresh viewer identify actor, target, contact, exact delta, and consequence from the battlefield without relying on the fact strip?

## Completed iteration — At-source Impact Readability

- **Player problem:** Damage and other consequences update bars and supporting text, but the target card does not visibly own the impact beat.
- **Falsifiable hypothesis:** If typed damage, healing, guard, break, and defeat events render exact deltas and restrained reactions at the affected unit, a viewer can identify the action and consequence with the event inspector and fact strip hidden.
- **Playable scope:** Add at-source delta feedback, stronger actor/target/contact states, distinct temporary silhouettes by role, and remove the mobile footer overlap.
- **Explicit exclusions:** No new combat rules, encounter tuning, equipment implementation, roster generation, campaign, or prose expansion.
- **Human success criteria:** A fresh viewer identifies actor, target, action, delta, and consequence from the battlefield; owner finds normal-speed playback readable.
- **Automated protection:** Browser screenshot fixture at a damage event; at-source delta/target assertions; reduced-motion equivalent; mobile geometry assertion.
- **Result:** KEEP — automated and visual gate passed. Readability and presentation improved from 2/5 to 3/5; mobile overlap closed. Human confirmation remains required.
- **Evidence:** Build passed; Vitest 28/28; Playwright 9 passed with only the separate equipment acceptance intentionally red; normal playback 69.9 seconds.
- **Next highest-risk question:** Does a typed equipment choice create an immediate, visible plan change for encounter two?

## Completed iteration — Equipment Follow-up Choice

- **Player problem:** The first result has no follow-up decision, so the loop ends with explanation rather than tempting a changed plan for encounter two.
- **Falsifiable hypothesis:** If the player chooses between two plain, mechanically different front-slot items and sees the exact forecast effect before encounter two, the result becomes a near-term planning decision rather than a passive report.
- **Playable scope:** Two typed equipment options after encounter one; explicit selection and confirmation; next encounter locked until confirmation; chosen item visible in preparation and authoritative command; deterministic effect in encounter two; persistence through a `SaveRepository` interface and LocalStorage adapter.
- **Explicit exclusions:** Currency, inventory grid, rarity tiers, crafting, random loot tables, generated items, broad save migration, and equipment art production.
- **Human success criteria:** Player explains the tradeoff, chooses an item for a stated plan, and changes or confirms formation because of it.
- **Automated protection:** Zod-validated reward facts; deterministic item effect; next encounter locked before confirmation; browser journey through selection/confirmation/reload; malformed-save recovery.
- **Result:** KEEP — domain/UI/browser gates passed. Human interest remains unproven.
- **Evidence:** strict typecheck and build passed; Vitest 46/46; isolated QA Playwright 15/15; normal playback 70.2 seconds; reload, malformed/incompatible recovery, preferences, desktop/mobile, and authoritative item facts passed.
- **Next highest-risk question:** Does one battle-derived character condition create an interesting preparation decision without adding busywork?

## Completed iteration — Battle-derived Condition

- **Player problem:** Combat changes the result screen but does not yet leave a character-specific condition that affects the next plan.
- **Falsifiable hypothesis:** If a defeated hero becomes visibly Bruised for encounter two while a no-defeat plan avoids the condition, players will connect preparation to a persistent character story and reconsider formation.
- **Playable scope:** Derive one typed aftermath fact from battle events; apply a concrete next-battle health penalty to the first defeated hero; show the source event and next-battle effect; persist the condition; show a clear no-injury result when nobody falls.
- **Explicit exclusions:** Injury inventory, recovery currency, long event prose, random injury tables, relationships, awakening, and campaign scheduling.
- **Human success criteria:** Player notices who is Bruised, explains which battle event caused it, and considers the condition when planning encounter two.
- **Automated protection:** Event source link; deterministic consequence; changed command/save schema; no condition when all heroes survive; visible result and preparation facts; reload equality.
- **Result:** KEEP — the typed condition, source link, save/reload path, no-injury branch, and encounter-two penalty passed independent QA. Whether the condition is interesting remains a human question.
- **Evidence:** strict typecheck and production build passed; Vitest 56/56; clean Playwright 19/19 in 94.4 seconds; normal playback 70.2 seconds; desktop, 125% text, reduced motion, and mobile footer geometry passed.
- **Next highest-risk question:** After the complete two-encounter loop, does the player voluntarily replay with a different plan?

## Completed gate — Owner Playtest 01

- **Player problem:** Automated evidence proved the loop correct in fixtures but could not establish enjoyment, hero ownership, condition notice, or desire to replay.
- **Falsifiable hypothesis:** If the encounter tell, visible battle causality, equipment choice, and Bruised/no-injury aftermath formed a useful loop, the owner would explain the turning point, make a stated counter-plan, and voluntarily want another attempt.
- **Playable scope:** The complete authored encounter pair and its current preparation, equipment, condition, battle, and result surfaces.
- **Explicit exclusions:** Encounters three and four, generated roster, campaign, additional injuries, narrative content, and final art.
- **Human success criteria:** Enjoy normal-speed playback; identify battle causality without the inspector; change a plan from the enemy tell; notice Bruised or No injury; choose to replay without prompting.
- **Automated protection:** 56 Vitest and 19 Playwright checks remained the regression baseline.
- **Result:** REVISE — functional but flat. The owner wants to keep the autobattler direction and visible plan causality. Visuals were mixed, heroes felt like fixed role pieces, Bruised went unnoticed amid an overwhelming log, and replay desire was unclear.
- **Next highest-risk question:** Can a small hero-specific preparation choice create ownership before generated recruitment is introduced?

## Completed iteration — Per-hero Stance Ownership

- **Player problem:** Preparation feels like moving fixed tank, damage, and support pieces instead of shaping individual heroes.
- **Falsifiable hypothesis:** If Ada, Bo, and Cy each have one unique two-option stance with a visible forecast and distinct authoritative battle effects, each hero will feel shaped by the player rather than defined only by a fixed role.
- **Playable scope:** Per-hero stance controls for Ada, Bo, and Cy; typed stance rules, command fields, events, and forecast facts; save-safe deterministic commands; visible battlefield triggers; less ordinary reliance on the exact-event log; stable placeholder hooks for later character art, animation, number effects, skill effects, debuffs, and statuses.
- **Explicit exclusions:** Generated roster, recruit or gacha economy, new encounters, final art, campaign, currencies, and broad injury systems.
- **Human success criteria:** In Owner Playtest 02, the player states all three chosen stances; predicts one concrete effect for each; notices at least two stance triggers without opening the inspector; explains one changed battle outcome; identifies one hero they deliberately shaped; notices Bruised before Punish; and rates both the visuals and desire to replay.
- **Automated protection:** Strict schema and command validation; deterministic same-command equality; save/reload compatibility; one-variable tests proving each stance changes only its stated rules; typed trigger and forecast facts; browser journeys covering all six options, keyboard input, reduced motion, mobile layout, and exact battlefield/result agreement.
- **Result:** REVISE at the human gate. The independent automated result remains KEEP, the improved visual direction should stay, and stance mechanics should remain as a foundation. In Owner Playtest 02, only Ada's stance was noticed; changing a stance did not visibly read; healer differentiation was clearest while the other hero identities stayed generic; Bruised was missed again; playback felt too fast and dense; and the owner did not want another attempt.
- **Next highest-risk question:** Can a small set of paced, causal battle moments make stance effects and Bruised readable without changing the authoritative simulation?

## Completed iteration — Key Moments Playback

- **Player problem:** Authoritative combat is correct, but routine event churn moves too quickly for the player to connect a stance, enemy rule, break, defeat, or Bruised consequence to the outcome.
- **Falsifiable hypothesis:** If typed causal chains are grouped into a small set of readable plays, routine facts are compressed, and key moments hold longer, the owner will notice stance activations and Bruised and explain one stance-caused outcome without opening the inspector.
- **Playable scope:** Keep the authoritative battle unchanged; group typed causal chains into a small set of readable plays or highlights; compress routine facts; hold longer for stance, enemy-rule, break, and defeat moments; replace ordinary event churn with a concise moment summary; and make Bruised part of the encounter-two start decision.
- **Explicit exclusions:** Final sprites, generated candidates, encounters three and four, simulation rebalance, and campaign.
- **Human success criteria:** without Exact events, owner notices at least 2 of 3 chosen stance activations, explains one stance-caused outcome, notices Bruised before Punish, and rates pacing readable.
- **Automated protection:** Preserve deterministic authoritative events and results; prove playback grouping does not alter commands or simulation outcomes; cover the typed moment chains, concise summary, Bruised start decision, reduced motion, desktop, and mobile paths.
- **Result:** KEEP WITH LIMITATION by the owner. Pacing is acceptable and the key report or aftermath explanation is sufficient at this stage, but live stance activation and Bruised notice did not pass and are not claimed solved for fresh players. Automated evidence remains green: typecheck; Vitest 86/86; 151-module production build; Playwright 27/27 in 2.2 minutes; focused Key Moments 3/3; normal playback 39.8 seconds; 28 displayed key moments versus 279 raw events; no P0–P2 source defect or console, page, network, layout, or fallback issue.
- **Next highest-risk question:** Can seeded candidate comparison create discovery and attachment before any candidate is made fieldable?

## Completed iteration — Seeded Candidate Draft Lab

- **Player problem:** The fixed authored trio has no hero discovery, comparison, or attachment choice.
- **Falsifiable hypothesis:** Three deterministic, compatibility-checked candidates with plain mechanical comparisons will cause the player to make a reasoned choice and voluntarily request another roster.
- **Playable scope:** A seeded three-candidate comparison; select one favorite; reroll with a new seed; show a mechanical fingerprint; reject duplicates; keep candidates inside the draft lab rather than fielding them; enforce a concise grammar contract; and repair current-loop text concurrently.
- **Explicit exclusions:** Combat integration, final art, campaign, currencies, broad biographies, arbitrary fragment prose, and encounters three and four.
- **Human success criteria:** The player states why each candidate differs, chooses one for a mechanical or build reason, identifies one risk or tradeoff, and voluntarily requests another roster.
- **Automated protection:** Same-seed equality; named RNG streams; runtime schema validation; a 100-seed semantic-diversity and no-duplicate check; browser selection, reroll, keyboard, reduced-motion, desktop, mobile, and text-scale coverage; and grammar assertions.
- **Implementation result:** Candidate lab and concurrent plain-language repair are complete. Candidates remain comparison-only and cannot enter combat.
- **Automated evidence:** Focused candidate Playwright passed 3/3; final full Playwright passed 30/30 in 2.2 minutes; normal playback took 39.6 seconds; full Vitest passed 98/98; strict typecheck and the 160-module production build passed; authoritative code contains no `Math.random`.
- **Seed evidence:** Across 100 deterministic seeds, generation succeeded 100/100 and produced 300 candidates, 298 semantic fingerprints, 36 core builds, minimum semantic distance 3, 93% multi-chassis sets, full required content coverage, and average 1.07 / maximum 2 retries.
- **QA learning:** Independent QA found a same-set duplicate-name issue. Identity filtering now excludes already-used identity IDs before the identity stream chooses, without tying cosmetic identity to mechanical generation. The focused and full browser gates passed afterward.
- **Presentation note:** The orphan-period wrap in the mobile favorite status was fixed. Comparing three full mobile cards still requires substantial vertical scrolling; keep this as P2 polish evidence for the owner playtest.
- **Human evidence:** The owner identified useful variation across stats, advantages, technique effects, and numbers; favored a basic-attack and technique-point ramping combination; treated persistent Strain after Guard as a meaningful risk; and voluntarily chose **Show new candidates**.
- **Result:** **KEEP.** The automated and human gates passed for the bounded comparison lab.
- **Economy boundary:** Unlimited new sets remain a lab-only affordance. Rarity weighting and recruitment cost or resources wait until a real run loop provides a source and sink.
- **Gate discipline:** This was the same owner, so fresh sessions remain 1/5 and the Phase 2 exit has not passed. Candidates remain outside the campaign roster.
- **Next highest-risk question:** Can a selected candidate's promised mechanics read clearly when executed in combat?

## Completed human gate — Single-Candidate Combat Trial

- **Player problem:** Candidate cards promise distinct mechanics, but those promises are not yet executable or fieldable.
- **Falsifiable hypothesis:** If one selected generated hero enters a controlled fight, the player will see a causal kit identity rather than only reading a comparison card.
- **Playable scope:** Choose one generated candidate, place that candidate with two fixed training partners against three fixed opponents, play the fight through battlefield-first Key Moments, and expose the candidate's selected rules through visible combat facts and a concise kit report.
- **Explicit exclusions:** No full campaign roster replacement, currency or economy, large content expansion, or art batch.
- **Human success criteria:** The owner names at least two candidate rules that activated, connects one rule to a numerical or status outcome, and says whether they would recruit that candidate.
- **Automated protection:** Deterministic replay and provenance validation; exact structured trigger and mutation events; all 36 core builds; 300 generated candidates from 100 seeds; battle termination; causal presentation regressions; desktop, mobile, reduced-motion, keyboard, and complete browser journeys; truthful UI copy; no `Math.random`.
- **Result:** **REVISE.** Keep the clearer battlefield/report presentation and the deterministic harness. Remove the trial from the intended recruitment path. The owner did not understand the umbrella phrase “candidate rules” or provide one exact rule-to-number explanation, so that language/comprehension claim did not pass. However, the owner independently assembled Fast Frame + Building Rhythm + Focused Strike + Measured Combo, judged the combination very strong, and would recruit it while rejecting weaker candidates. Build discovery and recruitment intent passed.
- **Evidence:** Typecheck and 172-module production build passed; Vitest 115/115 passed; focused candidate-trial Playwright 3/3 and final full Playwright 33/33 passed; all 36 core builds and 300 candidates terminated; Measured Combo reports only its Points gain; Shared Strain reports only its Strain and directly caused Broken chain; mobile ribbon overlaps 0/6 fighter cards.
- **Next highest-risk question:** Whether the clearer presentation survives contact with the real two-encounter loop and its formation, stance, equipment, enemy-rule, and injury facts.

## Current iteration — Main-loop Presentation Consolidation

- **Player problem:** The clearest autobattle and report UI exists in a studio-only candidate trial, while the intended two-encounter player loop still carries the older, denser presentation.
- **Falsifiable hypothesis:** If the real Pressure/Punish flow adopts the trial's battlefield-first hierarchy and concise causal report, the player will explain a decisive plan effect without Exact events and will not need a separate pre-recruitment combat trial.
- **Playable scope:** Remove Candidate trial from normal navigation; keep it as an internal deterministic harness; reuse the clearest trial presentation patterns in the authored battle and result flow; rename or remove development language rather than teaching “candidate rules”; preserve all current formation, stance, equipment, Bruised, save, and combat behavior.
- **Explicit exclusions:** No run currency, recruitment transaction, full generated roster replacement, new encounters, simulation rebalance, art batch, campaign, or new narrative system.
- **Human success criteria:** In the normal Pressure/Punish loop, the owner identifies one chosen plan or hero build effect, connects it to one exact number or status in the report, and says the separate trial is no longer needed in the player flow.
- **Automated protection:** Main simulation and command equality; complete prepare–battle–result–next-fight journey; causal report facts; no Candidate trial entry in normal navigation; internal candidate-trial determinism remains covered; desktop, mobile, reduced motion, keyboard, save/reload, and GitHub Pages path.
- **Implementation result:** The normal Candidates page is read-and-choose only. The controlled candidate fight remains reachable through the internal `?harness=candidate-trial` route for deterministic studio checks. Pressure and Punish now use focused battle playback, keep exact events behind **Battle details**, and end with a typed **What your plan did** report for setup, policy, all three stances, and the turning point.
- **Automated evidence:** Strict typecheck and the 173-module production build passed; Vitest passed 120/120; full Playwright passed 33/33 in 3.0 minutes; normal playback took 39.7 seconds; the GitHub Pages-style `/Secondverse/` path passed; authoritative source contains no `Math.random`.
- **Independent QA:** Initial REVISE found a stretched desktop result battlefield and a Starting plan link that repeated policy evidence. After repair, QA returned KEEP: all six fighters fit in the opening desktop and mobile views, no horizontal overflow remained, and Starting plan now links to distinct typed formation + policy evidence.
- **Result:** **AUTOMATED KEEP — READY FOR OWNER PLAYTEST.** This proves truthful presentation and complete journeys, not player comprehension or renewed desire to replay. The whole prototype remains REVISE and Phase 2 remains open at 1/5 fresh sessions.
- **Next highest-risk question:** Whether readable main-loop combat creates enough confidence to begin the smallest Phase 4 recruitment/run decision without hiding unresolved Phase 2 fresh-session evidence.

## Likely files and systems at risk

- Normal navigation and Candidate Lab entry actions
- Authored BattleScreen, UnitCard/stage hierarchy, Key Moments selection, and ResultScreen report hierarchy
- Shared plain-language presentation helpers and CSS tokens
- Existing browser journeys plus internal candidate-trial coverage

## Session protocol check

- Required files inspected: absent at start; created in this session.
- Repository and test state inspected: strict app, simulation, save boundary, and browser suite are present and green.
- Implementation state: the authored encounter pair, Key Moments Playback, candidate draft lab, and controlled trial are playable. The current iteration promotes the clearer trial presentation into the real loop and removes the trial from normal player navigation.
- Branch target: `codex/reimagine-core-loop`.
- Taste comparison prepared: `docs/COMBAT_PRESENTATION_COMPARISON.md` now fixes the shared information hierarchy, encounter-pair question, direction-independent accessibility rules, and timing ranges without choosing the owner-owned presentation identity.
- Language constraint: plain and mechanical; no bombastic vocabulary.
