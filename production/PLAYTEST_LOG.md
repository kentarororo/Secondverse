# Playtest Log

## Required evidence standard

Automated checks protect correctness; they do not establish fun. Each implemented encounter pair receives an independent playtest. The implementer may not judge the feature they built.

### Prototype gate

- 4/5 fresh players explain why the battle was won or lost.
- 4/5 change their plan after seeing the enemy tell.
- 3/5 express preference or attachment toward a generated hero.
- 3/5 voluntarily choose a new roster or next fight without prompting.
- No player needs the full battle log to understand the decisive moment.
- At least three materially different plans are viable across the encounter set.
- The owner says the battle is enjoyable to watch at normal speed.

## Sessions

A playable first encounter pair exists. Human sessions: **1/5**. Owner Playtests 01, 02, and 03 used the same owner, so four fresh sessions remain before the prototype gate can pass.

## Current verdict

**REVISE — functional but flat.** Owner Playtest 03 gives Key Moments a **KEEP WITH LIMITATION**: pacing is acceptable and the key report or aftermath explanation is sufficient at this stage, but live stance and Bruised notice did not pass and are not claimed solved for fresh players. The same owner ran all three owner sessions, so fresh sessions remain **1/5**. The Phase 2 five-session exit has not passed.

## Pre-build independent QA — 2026-08-06

- **Verdict:** NOT TESTABLE.
- **Highest P0 risks:** presentation timing influencing authority; infinite reaction chains; replay divergence; GitHub Pages base-path failure; malformed storage blocking a clean start.
- **Highest P1 risks:** late or misleading tells; invisible planning leverage; one plan dominating both encounters; signature emphasis becoming noise; decisive slowdown highlighting size rather than causality; mobile or reduced-motion loss of information.
- **Required fixtures:** fresh first contact; one-variable rear-pressure comparisons; one-variable front-break comparisons; cross-encounter dominant-plan check; forced signature and decisive-event readability checks.
- **Gate discipline:** authored-trio testing cannot satisfy generated-hero attachment. That remains a Phase 3 criterion.

## Browser gate 1 — 2026-08-06

- **Build:** local production preview, fixed seed `lab-pressure-v1`.
- **Automated result:** build passed; Vitest 26/26; Playwright 8 passed and 2 intentional acceptance failures.
- **Planning evidence:** default Hold front plan won after 55 actions; Ada middle plus Cover rear won after 39 actions and changed the turning point to Ada’s interception.
- **P1:** Required equipment reward decision is absent.
- **P1:** Damage is read mainly through the supporting fact strip; the battlefield lacks at-source delta/contact/reaction feedback.
- **P2:** Mobile sticky footer overlaps a formation control at 390×844.
- **Focused scorecard:** comprehension 3/5; planning 3/5; readability 2/5; presentation 2/5; stability/accessibility/performance 3/5.
- **Human evidence:** none. Do not claim fun, owner enjoyment, or desire to continue.
- **Verdict:** REVISE.

## Browser gate 2 — Readability revision — 2026-08-06

- **Automated result:** build passed; Vitest 28/28; Playwright 9 passed with one separate expected equipment failure.
- **Impact evidence:** actor, target, action, signed delta, reaction, and resulting state are visible at the affected unit for the fixed damage event.
- **Accessibility evidence:** reduced motion preserves the information chain; 390×844 mobile no longer overlaps formation controls.
- **Timing:** 69.9 seconds at normal speed.
- **Focused score change:** readability 2→3; presentation 2→3; stability/accessibility/performance 3→4 provisional.
- **Remaining P2:** Normal-motion delta is somewhat small/faint; verify with humans before more tuning.
- **Verdict:** KEEP for readability; whole slice remains REVISE because equipment choice is absent.

## Browser gate 3 — Equipment follow-up — 2026-08-06

- **Automated result:** build and typecheck passed; Vitest 46/46; isolated Playwright 15/15.
- **Choice evidence:** Heavy Pad and Quick Shoes expose exact guard/speed tradeoffs; selection is reversible and confirmation gates progression.
- **Causal evidence:** Encounter-two preparation and exact events expose the confirmed item’s authoritative effect.
- **Persistence evidence:** confirmed equipment reloads into Punish the Front; malformed/incompatible saves recover; UI preferences do not change the result.
- **Viewport evidence:** desktop, 125% text, reduced motion, and 390×844 mobile passed.
- **Human evidence:** none; do not claim the item choice is interesting or motivates continuation.
- **Verdict:** KEEP — playable internal candidate.

## Browser gate 4 — Battle-derived condition — 2026-08-06

- **Automated result:** typecheck and production build passed; Vitest 56/56; clean Playwright 19/19 with exit code 0 in 94.4 seconds.
- **Causal evidence:** the aftermath names the first defeated hero, links to the exact defeat event, and applies a 12 maximum-health penalty in encounter two.
- **Alternative evidence:** a no-defeat plan produces No injury and no encounter-two penalty.
- **Persistence evidence:** Bruised and no-injury states survive the save boundary; an older compatible v1 save without the field loads safely.
- **Presentation evidence:** the condition is visible in results and preparation; normal playback is 70.2 seconds; desktop, 125% text, reduced motion, and mobile geometry pass without footer overlap.
- **Human evidence:** none. Causality, interest, and desire to replay require owner/fresh-player observation.
- **Verdict:** KEEP — hand to the owner before adding encounters three and four.

## Owner Playtest 01 — 2026-08-07

- **Tester:** Owner.
- **Scope:** The complete authored encounter pair: Pressure the Rear, equipment choice, Punish the Front, and the current result/explanation surfaces.
- **Watching enjoyment:** “Mixed - I see the vision and I like it, but right now visually it's just not so pleasing, im thinking how numbers fly in maplestory or ragnarok would be great on top of the detailed skills debuffs statuses moves etc. we can build the skeleton first then add art later, make sure we plan placeholders for that (it will be ai assisted as well)”
- **What changed in the first fight:** “This is good, it's more autobattler, lets keep it that way.”
- **Plan and equipment response:** “This is my issue, i still don't feel the customizability of my heroes, its fixed damage tank support and perhaps we can look at character customization at the start in some form or another, maybe it has to be in the progression of a roguelike from a base three tank damage support start but with more rng procedural generation true to the game.”
- **Bruised response:** “Didnt even notice bruise, didn't read all logs cause it's just overwhelming”
- **Desire to replay:** “Unsure about this question”
- **What worked or felt flat:** “Team policy only affects Ada and tank roles, I feel there should be stances or option for each member and this can be unique traits for each generated hero down the road. The initial roadmap of an almost gacha excitement type of new heroes to collect is definitely the way to go.”
- **Owner verdict:** “I feel some of my comments are revise and some are to keep and build on it, which might not be correct at this stage of development but keep in mind.”
- **KEEP:** The autobattler direction and visible preparation-to-battle causality.
- **REVISE:** Visual presentation is mixed; preparation feels like moving fixed damage/tank/support pieces; Bruised was not noticed; the exact log is overwhelming; desire to replay is unclear.
- **Studio interpretation:** Generated recruit and collection excitement remains the intended direction. Phase 2 first tests whether one unique two-option stance per authored hero makes Ada, Bo, and Cy feel shaped by the player before generated candidates are introduced.
- **Whole-prototype verdict:** **REVISE — functional but flat.** Automated correctness remains green, but the human gate did not establish hero ownership, condition readability, visual satisfaction, or replay desire.

## Browser gate 5 — Per-hero stance ownership and readability — 2026-08-07

- **Implementation state:** Complete for the bounded authored-hero stance iteration; production build complete.
- **Engineering result:** Typecheck passed; Vitest 73/73 passed; Playwright 24/24 passed.
- **Timing:** Normal-speed playback completed in 71.8 seconds, inside the 45–90 second target.
- **Stance evidence:** All three hero cards show the selected stance; each selected hero exposes exactly two forecasted choices; a one-variable Cy stance change produces different authoritative result events.
- **Battlefield evidence:** `stance_used` appears at its actor with name, effect, point cost, and trigger reason. Primary HP changes are more prominent than secondary facts. Marked, Broken, and Defeated remain visible beyond their source event.
- **Condition evidence:** `Bruised · −12 max HP` remains visible through Punish, including mobile battle.
- **Accessibility and fallback evidence:** Desktop, 125% root text, 390×844 mobile, system reduced motion, and in-app reduced motion passed without horizontal scroll or control overlap. Missing combat art uses CSS fallbacks without a broken image request.
- **Failure evidence:** No console errors, page errors, or failed required requests. Independent QA found no P0–P2 defect.
- **Independent automated verdict:** **KEEP.** This does not change the whole-prototype verdict without human evidence.
- **Owner Playtest 02 gate:** The player states all three chosen stances; predicts one concrete effect for each; notices at least two stance triggers without the inspector; explains one changed battle outcome; identifies one hero they deliberately shaped; notices Bruised before Punish; and rates the visuals and desire to replay.
- **Human evidence:** Not yet collected at this browser gate. Owner Playtest 02 below supplies the human result.
- **Scope gate:** Generated candidates and encounters three and four remain blocked.

## Owner Playtest 02 — 2026-08-08

- **Tester:** Owner; same tester as Owner Playtest 01, so fresh human sessions remain **1/5**.
- **Scope:** The completed per-hero stance and battlefield-readability iteration across the authored encounter pair.
- **Which stance did you choose for each hero, and what did you expect it to do?** "Brace early for tank, finish weak for dps, Aid two for support as i expected aoe damsge from the team"
- **Which stance activations did you notice during battle?** "Tank's stance"
- **Did changing a stance visibly change the fight?** "Not really because there's too many things happening and I guess the log is too complex in its current design to read. What if it was more like how football manager 24 played it out?"
- **Which hero, if any, felt shaped by your choices?** "Healer's single vs aoe healing. the rest felt generic. Probably tank stance mattered more"
- **Did you notice Bruised before starting Punish the Front?** "No again, honestly, the simulation was way too fast"
- **Were the battle visuals better, mixed, or worse?** "Feels good, I can imagine this with sprites and animations, is that what you are thinking also?"
- **Did you want another attempt?** "No I think we should keep going, unless my comments warrant changes"
- **KEEP:** The improved visual direction. Keep the stance mechanics as a foundation; healer differentiation was the clearest example of a shaped hero.
- **REVISE:** The human stance/readability gate failed. Only Ada's stance activation was noticed, the changed stance did not visibly read, the non-healer identities remained generic, Bruised was missed again, the simulation felt too fast, and event/log density was too complex.
- **Replay evidence:** The owner did not want another attempt.
- **Whole-prototype verdict:** **REVISE — functional but flat.** Automated correctness remains valid, but the human observation did not establish stance causality, condition notice, readable pacing, or replay desire.
- **Next iteration:** Key Moments Playback will keep authoritative battle outcomes unchanged while grouping typed causal chains into a few readable plays, compressing routine facts, holding longer on stance, enemy-rule, break, and defeat moments, replacing ordinary event churn with a concise moment summary, and making Bruised part of the encounter-two start decision.
- **Scope gate:** Final sprites, generated roster, encounters three and four, simulation rebalance, and campaign remain excluded. Generated candidates remain gated.

## Browser gate 6 — Key Moments Playback — 2026-08-08

- **Implementation state:** Complete for the bounded grouped-playback iteration.
- **Engineering result:** Typecheck passed; Vitest 86/86 passed; production build passed with 151 modules; full Playwright passed 27/27 in 2.2 minutes; focused Key Moments passed 3/3.
- **Timing:** Normal Key moments playback completed in 39.8 seconds, inside the 35–75 second target.
- **Compression evidence:** The captured battle showed 28 displayed key moments versus 279 intact raw events. Every action remains reversible, grouped, and outcome-identical to Key moments.
- **Causal evidence:** Playback advances by moment endpoints; the current card shows cause, target, and exact result; compressed actions show a routine-advance count; the plan tracker keeps Ada, Bo, and Cy visible and records chosen stance name, effect, cost, outcome, and used round without Exact events.
- **Condition evidence:** Punish preparation shows a prominent Bruised panel and the exact dynamic start action `Start with Bo Bruised · −12 max HP`; the no-injury path remains `Start battle`.
- **Accessibility and layout evidence:** Desktop, 125% text, 390×844 mobile, keyboard, system reduced motion, and in-app reduced motion passed. Reading holds preserve facts and authoritative outcomes. No horizontal scroll or overlap was found.
- **Failure and fallback evidence:** No console error, page error, failed required request, layout failure, or missing-asset fallback issue was found. Independent QA found no P0–P2 source defect.
- **Independent automated verdict:** **KEEP.** Whole-prototype verdict remains **REVISE — functional but flat** until human evidence exists.
- **Owner Playtest 03 gate:** without Exact events, owner notices at least 2 of 3 chosen stance activations, explains one stance-caused outcome, notices Bruised before Punish, and rates pacing readable.
- **Human evidence:** Not yet collected. Do not infer stance notice, Bruised notice, or readable pacing from automation.
- **Scope gate:** Final sprites, generated candidates, and encounters three and four remain gated until Owner Playtest 03 is recorded and evaluated.

## Owner Playtest 03 — 2026-08-08

- **Tester:** Owner; same tester as Owner Playtests 01 and 02, so fresh human sessions remain **1/5**.
- **Scope:** Key Moments Playback, live stance and Bruised notice, pacing, report usefulness, and readiness to begin a comparison-only candidate lab.
- **Which stance activations did you notice, what stance-caused outcome could you explain, and did you notice Bruised before Punish?** "Honestly, I still can't tell, there's too much going on but I don't think a normal player will notice it within, but on the key report. so I think if key moments is working it's good enough"
- **Was the pacing readable?** "It's okay, like I said, it's more on the backend report to figure out what went wrong that its more important to fix the UI on"
- **Should candidate work remain gated, or can plain-language repair and candidate variety proceed together?** "I still have some issues with text and grammar structure, e.g. 'Ada wears it in the front' can we fix that concurrently while moving on to hero candidates for variety which might be better as we can see more grammatical flaws?"
- **KEEP WITH LIMITATION:** Keep Key Moments. Pacing is acceptable, and the key report or aftermath explanation is sufficient at this stage.
- **Unresolved:** Live stance activation and Bruised notice did not pass. Do not claim those are solved for fresh players.
- **Owner authorization:** Begin the generated-candidate draft lab while repairing concise text and grammar in the current loop.
- **Gate discipline:** This owner session does not increase fresh sessions beyond **1/5** and does not pass the Phase 2 five-session exit.
- **Next iteration:** Seeded Candidate Draft Lab: three deterministic, compatibility-checked, duplicate-free candidates shown for comparison, favorite selection, and reroll only. Candidates are not fieldable yet.
- **Scope gate:** Combat integration, final art, campaign, currencies, broad biographies, arbitrary fragment prose, and encounters three and four remain excluded.

## Browser gate 7 — Seeded Candidate Draft Lab and language repair — 2026-08-08

- **Implementation state:** Complete for the bounded comparison lab and current-loop language repair. Candidates are explicitly `lab_only_not_fieldable` and do not change the battle team.
- **Automated result:** Candidate-focused Playwright passed 3/3; final full Playwright passed 30/30 in 2.2 minutes; full Vitest passed 98/98; strict typecheck and the 160-module production build passed.
- **Timing:** Normal Key moments playback completed in 39.6 seconds, inside the 35–75 second target.
- **Determinism:** Authoritative candidate and combat code uses named RNG streams and no `Math.random`.
- **100-seed evidence:** 100/100 seeded sets generated; 300 candidates; 298 semantic fingerprints; 36 core builds; minimum semantic distance 3; 93% of sets used multiple chassis; all required content families appeared; generation averaged 1.07 retries with a maximum of 2.
- **Journey evidence:** Three structured candidate cards, favorite selection, new-set generation and selection clearing, preserved battle preparation, keyboard-only use, desktop at 125% text, 390×844 mobile, system reduced motion, plain-language preparation/result copy, and absence of the rejected equipment phrase all passed without console, page, or request failures.
- **QA learning:** Independent QA found two candidates in one set could share a display identity. The fix filters identity IDs already used in the set before the identity RNG stream chooses. Mechanical generation and seeded rules remain unchanged. The candidate-focused and full gates passed after the fix.
- **Presentation evidence:** The mobile favorite-status orphan period was fixed. The remaining P2 is comparison density: three full cards require substantial vertical scrolling on mobile.
- **Automated verdict:** **KEEP.** This proves the bounded implementation is reproducible and usable; it does not prove preference, attachment, or desire for another set.
- **Iteration result:** **IN PROGRESS — READY FOR OWNER PLAYTEST.** Do not record a completed KEEP until the human draft gate is observed.
- **Owner questions:** Why does each candidate differ? Which is the favorite and why? Which risk matters? Does the owner voluntarily choose **Show new candidates**?
- **Gate discipline:** Fresh sessions remain **1/5**. The Phase 2 five-session exit has not passed. Combat integration remains gated, and candidates are not fieldable.

## Delivery repair — GitHub Pages path — 2026-08-06

- **Observed problem:** the supplied local project-path URL returned 404, and the repository had no Pages deployment workflow.
- **Cause:** Vite used a relative base while the delivery guide and browser fixture used `/Secondverse/`; GitHub had no workflow that uploaded `dist` to Pages.
- **Change:** use `/Secondverse/` for development and production, and deploy the built `dist` artifact through GitHub Pages Actions.
- **Gate result:** production build passed; the focused Pages-path browser journey passed 1/1; the production preview reports the exact `/Secondverse/` URL.
