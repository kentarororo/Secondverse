# Combat laboratory: first encounter pair

## Purpose

The first pair tests one question: does a visible change to formation or policy produce a different turning point that the player can explain?

Normal actions are deliberate and easy to track. A signature rule or decisive change may use stronger motion and a short pause in the presentation. The simulation remains discrete and round-based underneath that presentation.

## Playable plan

The player fields the same three authored heroes and chooses:

- one hero in each of the front, middle, and rear slots;
- one team policy: **Hold front** or **Cover rear**;
- one technique policy for each hero: **Use early** or **Wait for need**.
- one explicit front-slot equipment choice: none, **Heavy Pad**, or **Quick Shoes**.

The player then chooses one of two encounters and starts a seeded battle. The same encounter, seed, and plan always produce the same event sequence and final state.

## Authored trio

| Hero | Role | Basic action | Technique | Signature rule |
| --- | --- | --- | --- | --- |
| Ada | Guard | Hit the nearest living enemy | Brace: add guard to self | Step In: while Cover rear is active, intercept a marked rear strike from the middle slot |
| Bo | Damage | Hit the nearest living enemy | Heavy Hit: higher damage | Follow Up: Heavy Hit deals extra damage to a target below half health |
| Cy | Support | Hit the nearest living enemy | First Aid: heal the most injured ally | Quick Help: First Aid adds a small guard when the target is below one-third health |

These are mechanical test roles, not final character content.

## Encounters

### Pressure the Rear

**Tell:** The Rear Attacker marks the hero in the rear slot before every third action it takes.

**Rule:** The other two enemies favor the rear, and a marked strike targets that slot. Cover rear lets Ada intercept the marked strike when she is alive in the middle slot, but does not redirect ordinary attacks. Without an intercept, the marked target takes the hit. The player can instead put a durable hero in the rear or attack fast enough to stop the third action.

### Punish the Front

**Tell:** The Line Breaker repeatedly targets the front slot. Each hit adds one visible strain. At three strain, the front hero is broken, loses guard, and takes extra damage.

**Rule:** Hold front gives the front hero starting guard and reduces the damage that causes a break. Cover rear has no benefit against this rule. Moving Ada to the front or saving Brace for need can delay or prevent the break.

The pair is counterposed: putting Ada in the rear answers the first tell directly, while putting her in the middle with Cover rear answers the marked strike through interception. Both choices leave a weaker hero in front against the second encounter. Putting Ada in front and choosing Hold front answers the second encounter but leaves a weaker rear hero exposed in the first.

## Equipment follow-up

Winning Pressure the Rear offers exactly two authored choices. There is no rarity, price, random roll, inventory stack, or hidden effect.

| Item | Visible effect | Opportunity cost |
| --- | --- | --- |
| Heavy Pad | The front hero starts with 18 guard | The front hero loses 3 Speed |
| Quick Shoes | The front hero gains 4 Speed | It supplies no starting guard |

Equipment is assigned to the front slot rather than to a named hero. Reordering formation therefore changes who receives its effects. Heavy Pad can absorb the Line Breaker's first hits but may make the front hero act after it. Quick Shoes moves Ada from 10 to 14 Speed, ahead of the 12-Speed Line Breaker, but leaves the first hit unguarded unless another plan supplies guard.

The battle command always includes `frontEquipment`, including `none` before a reward is chosen. The same seed, formation, policies, and equipment must reproduce the same derived stats, order, events, and final state.

## Battle-derived condition

Each completed battle produces exactly one aftermath fact from its typed events:

- If a hero was defeated, the first hero defeat becomes **Bruised** for that hero. Bruised lowers maximum and current health by exactly 12 in the next Punish the Front battle.
- If no hero was defeated, the fact is **No injury** and links to the battle-end event.

There is no injury roll, table, recovery timer, treatment currency, or alternate label. Bruised keeps the `unit_defeated` event ID that caused it. No injury keeps the `battle_ended` event ID that proves it. The aftermath function returns one fact, never a list.

The next battle plan carries either one Bruised condition or `null`. Pressure the Rear ignores prior conditions because it creates the fact; Punish the Front applies Bruised once at setup. A `condition_applied` event links both to the prior defeat through `sourceEventId` and to the current battle start through `causedByEventId`. It records before and after maximum and current health.

## Discrete combat rules

1. Battle starts with equipment and team-policy effects, then proceeds through rounds.
2. Each living unit acts once per round, ordered by Speed. Equal Speed uses the named `initiative` random stream.
3. Before an action, the engine emits an intent event with actor, action, target, and visible reason.
4. Legal actions are `basic`, `brace`, `heavy_hit`, `first_aid`, `rear_mark`, `rear_strike`, and `line_hit`.
5. Heroes gain one technique point after a basic action, to a maximum of three. A technique costs two.
6. **Use early** uses a ready technique at two points when it has a legal effect. **Wait for need** uses it only when its authored condition is met, or at three points so it cannot stall forever.
7. Damage uses one derived path: `max(1, power + action power + variance - max(0, defence - break penalty))`. Guard absorbs damage before health.
8. Healing cannot exceed maximum health. Guard cannot exceed the unit's authored guard cap.
9. The battle ends when all units on one side are defeated, or at the action cap. The action-cap winner is the side with the higher remaining-health ratio; an exact tie is a draw.
10. Random damage variance comes only from the named `damage` stream. No authoritative system uses `Math.random`.

## Exact event contract

Every state change is a discriminated, serializable event. An event that changes health, guard, technique points, target, strain, or defeat state includes `causedByEventId`, linking it to the action or rule that caused it. Damage events include raw amount, defence, guard absorbed, and final health loss. The presentation may change timing but may not create combat facts.

Equipment uses the same derived-stat function as every unit. An `equipment_applied` event records base Speed, modifier, final Speed, and starting guard. Any resulting guard change links back to that event.

Bruised also uses the canonical derived-stat function. It changes no Power, Defence, Speed, guard cap, action rule, or target rule.

## Edge cases

- If the intended target is defeated before an action begins, targeting is resolved again and a fresh intent is emitted.
- Ada can intercept only while alive, assigned to middle, and not already the marked target.
- A unit defeated by a break hit does not act later in the round.
- Healing is not legal when every living ally is at full health; Cy uses a basic action instead.
- Guard is removed before health and never becomes negative.
- Equipment applies to the current front slot once at battle start and never follows a hero after the command is created.
- Bruised applies only in Punish the Front, only to its named hero, and only once at setup.
- A battle always terminates by team defeat or the action cap.

## Tuning data and safe ranges

All values live in `src/content/tuning.ts`.

| Knob | Initial | Safe prototype range |
| --- | ---: | ---: |
| Action cap | 72 | 48-90 |
| Basic action power | 4 | 2-7 |
| Damage variance | -1 to 2 | -2 to 3 |
| Technique cost | 2 | 2-3 |
| Rear strike power | 40 | 30-44 |
| Break threshold | 3 | 2-4 |
| Break bonus damage | 8 | 5-12 |
| Hold front starting guard | 18 | 12-24 |
| Intercept guard | 8 | 4-12 |
| Heavy Pad starting guard | 18 | 14-22 |
| Heavy Pad Speed | -3 | -2 to -4 |
| Quick Shoes Speed | +4 | +3 to +5 |

## Save boundary

The combat laboratory save is versioned and Zod-validated. It stores only:

- the selected equipment;
- a nullable Bruised condition derived from the previous battle;
- whether each of the two encounters has been completed;
- reduced motion, audio enabled, and battle speed preferences.

Playback timers, event cursors, in-progress animation state, event arrays, and generated prose are never saved. Storage is injected through a small `StorageLike` boundary behind `SaveRepository<CombatLabSave>`. Missing data returns `empty`; damaged, incompatible, or unavailable data returns a recoverable result. Clear remains available so bad data cannot block a clean laboratory session.

Version-one saves created before the condition field existed remain valid and load that field as `null`.

## Acceptance criteria

- Identical command input produces byte-for-byte equal results.
- Reordering only formation changes targets and at least one decisive event in each encounter.
- Changing only team policy changes mitigation or interception while all other inputs remain fixed.
- Changing only a hero technique policy changes that hero's selected action timing.
- Changing only front equipment changes first-round order or mitigation against Punish the Front.
- Heavy Pad and Quick Shoes effects are visible in canonical equipment and guard events.
- The default Pressure plan Bruises its actual first defeated hero; the stronger Cover plan produces No injury while it keeps every hero standing.
- Bruised changes maximum and current health by exactly 12 in Punish and never applies to Pressure.
- Every aftermath and applied-condition source ID resolves to the event that created or applied it.
- Every damage and state-change event has a valid causal predecessor.
- Both encounters terminate inside the action cap across the regression plans.
- Content fails fast through Zod validation.
- Save round-trip, damaged-data recovery, incompatible-version recovery, and clear are protected by tests.
- Existing version-one saves without a condition field load with a `null` condition.
- Authoritative source contains no `Math.random`.

Human validation remains separate: automated checks cannot establish that the battle is enjoyable or readable.
