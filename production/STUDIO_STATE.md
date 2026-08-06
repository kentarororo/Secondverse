# Studio State

**Updated:** 2026-08-06  
**Phase:** 2 — Combat Laboratory  
**Repository:** Clean reimplementation on `codex/reimagine-core-loop`; no commits yet  
**Status:** First encounter pair passes automated gates; waiting on required human playtest

## Highest-risk unanswered player-experience question

Which 60 seconds of automatic combat should a player want to watch again?

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

## Current gate — Owner Playtest 01

- **Player problem:** Automated evidence proves the loop is correct and readable in fixtures, but cannot prove that watching it is enjoyable or that the follow-up consequence motivates another attempt.
- **Falsifiable hypothesis:** If the encounter tell, visible battle causality, equipment choice, and Bruised/no-injury aftermath form a useful loop, the owner will explain the turning point, make a stated counter-plan, and voluntarily want another attempt.
- **Playable scope:** One clean run through Pressure the Rear, its equipment choice, and Punish the Front, followed by one replay of Pressure the Rear with a changed formation or policy.
- **Explicit exclusions:** No encounters three and four, generated roster, campaign, additional injuries, narrative content, or polish expansion before the observation is recorded.
- **Human success criteria:** Owner enjoys normal-speed playback; identifies actor, target, action, and consequence without the inspector; explains the win/loss; changes a plan from the enemy tell; notices and explains Bruised or No injury; chooses to replay without prompting.
- **Automated protection:** Existing 56 Vitest and 19 Playwright checks remain the regression baseline.
- **Result:** WAITING FOR HUMAN EVIDENCE
- **Next highest-risk question:** If the loop earns another attempt, which distinct combat question should encounters three and four test?

## Likely files and systems at risk after approval

- Project scaffold and quality configuration
- Pure simulation model, seeded RNG streams, commands, and combat events
- React battle shell and preparation controls
- CSS battlefield composition, animation timing, and reduced-motion behavior
- Vitest and Playwright fixtures

## Session protocol check

- Required files inspected: absent at start; created in this session.
- Repository and test state inspected: strict app, simulation, save boundary, and browser suite are present and green.
- Implementation state: two authored encounters, one equipment choice, and one battle-derived condition are playable.
- Branch target: `codex/reimagine-core-loop`.
- Taste comparison prepared: `docs/COMBAT_PRESENTATION_COMPARISON.md` now fixes the shared information hierarchy, encounter-pair question, direction-independent accessibility rules, and timing ranges without choosing the owner-owned presentation identity.
- Language constraint: plain and mechanical; no bombastic vocabulary.
