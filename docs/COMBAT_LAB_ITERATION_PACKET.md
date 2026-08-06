# Combat Laboratory Iteration Packet

**Gate:** Owner approval required before implementation  
**Question:** Which 60 seconds of combat should a player want to watch again?

## Player problem and hypothesis

**Problem:** Anotherverse has a strong systems thesis but no approved battle rhythm or visual hierarchy proving that automatic combat itself is desirable to watch.

**Hypothesis:** A battlefield that makes intent visible before impact, gives every action a clear actor and target, and isolates one decisive interaction with a brief slowdown will let players understand the turning point without a full log and make them want another fight.

## First playable flow — 3–5 minutes

1. **Read (20 seconds):** See one enemy tell, the reward category, and the current trio.
2. **Prepare (45–75 seconds):** Reorder front/middle/rear formation, choose one team policy, and set one technique preference per hero.
3. **Watch (45–90 seconds):** Follow intent cues, actions, damage/healing, guarding, statuses, signature triggers, and the decisive moment in a side-view arena.
4. **Understand (20 seconds):** See a three-beat explanation—plan, turning point, consequence—derived only from typed battle events.
5. **Change (30–60 seconds):** Choose one equipment reward or revise the plan, then replay the counterposed encounter.

## Playable scope

- One arena and one authored trio.
- Two encounters designed as opposite planning questions.
- Three formation slots.
- One team policy and one per-hero technique policy.
- Deterministic simulation and replay.
- Representative temporary animation, impact VFX, and audio cues.
- Concise battle explanation and one equipment choice.

## Explicit exclusions

No generated roster, campaign, routes, procedural quests or prose, crafting, currencies, multiple arenas, long lore, save migration, meta progression, or content expansion beyond the encounter pair.

## Success evidence

### Human

- The owner enjoys watching the battle at normal speed.
- 4/5 fresh players identify why it was won or lost.
- 4/5 change a plan after reading the enemy tell.
- 3/5 voluntarily choose replay/next fight.
- Nobody needs a full log to identify the decisive moment.

### Technical

- Same seed plus commands produces identical roster-independent battle facts.
- No authoritative `Math.random` usage.
- Unit tests protect formation, policy, targeting, signature triggers, and replay equality.
- Playwright protects the full prepare–battle–result–replay journey.
- Presentation consumes typed events and cannot mutate the simulation.

## Reuse and quarantine

The repository has no commits or files. Reuse the approved product thesis and deterministic browser architecture contract; quarantine the former campaign compiler and prose-heavy product direction conceptually. There is no legacy code to migrate.

## Two presentation directions

### A — Tactical Theatre

**Promise:** Deliberate 60–75 second battles where anticipation and causality create the drama.

- Fighters hold strong front/middle/rear silhouettes and move only for clear advances, attacks, rescues, and knockbacks.
- Intent lines and compact skill banners appear shortly before actions; impacts use restrained hit-stop and one decisive slowdown.
- UI favors readable health, resource, guard, and status state with low camera movement.
- Best fit for the fantasy of winning because the player understood formation and policy.
- **Risk:** May feel too clinical unless character reactions and sound carry emotion.

### B — Volatile Chorus

**Promise:** Faster 45–60 second battles where chained reactions make strange heroes feel explosive and alive.

- Fighters step, intercept, lunge, retreat, and visibly react; signature triggers can cascade across the trio.
- UI reveals intent closer to execution; impacts use stronger motion, camera emphasis, and short reaction chains.
- Information density is lower during action, with exact causal detail surfaced in brief pauses and the result recap.
- Best fit for the fantasy of discovering an unpredictable hero who changes the fight.
- **Risk:** Can obscure preparation leverage or feel arbitrary if reaction chains outpace comprehension.

### Recommended starting point

Start with **Tactical Theatre**, then borrow Volatile Chorus’s stronger motion only for signature triggers and decisive moments. Readability is the earliest failing layer, and spectacle can be layered onto proven causal clarity.

## Smallest owner decision

Choose **A — Tactical Theatre**, **B — Volatile Chorus**, or specify a hybrid. If you have them, add up to three exact battle/simulation reference moments and what works in each; they are taste evidence, not designs to copy.

Once this is approved, the Studio Lead may create `codex/reimagine-core-loop`, scaffold the project, and coordinate non-overlapping combat, presentation, and independent playtest lanes for the first encounter pair.
