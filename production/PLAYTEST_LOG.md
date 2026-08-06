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

A playable first encounter pair exists. Human sessions: **0/5**. The hybrid presentation direction is approved; owner playtest 01 is the current gate.

## Current verdict

**KEEP for human testing; prototype gate not yet passed.** The complete pair passes independent automated and visual checks. Human sessions remain **0/5**, so enjoyment and desire to continue are unproven.

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
