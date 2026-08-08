# Systems Index

This index stays lean while the combat laboratory answers one player-risk question at a time.

| Order | System | Player-facing proof | Status |
| --- | --- | --- | --- |
| 1 | Battle presentation | A player reads actor, target, action, impact, status, and advantage from the battlefield | Key Moments KEEP WITH LIMITATION: pacing acceptable; live stance and condition notice not proven for fresh players |
| 2 | Deterministic combat | Same seed and commands reproduce identical typed events and results | Implemented and verified for the first pair |
| 3 | Formation and team policy | A major preparation change produces a traceably different battle | Causal leverage kept; fixed-role limitation found in Owner Playtest 01 |
| 4 | Per-hero stance ownership | Ada, Bo, and Cy each offer two clear options with distinct forecast and battlefield effects | Foundation kept; live stance notice still did not pass in Owner Playtest 03 |
| 5 | Authored heroes and encounters | Three distinct heroes face enemies with visible, counterable rules | First pair implemented; healer differentiation reads clearest while other identities remain generic |
| 6 | Battle explanation | The decisive moment is understandable without requiring the full exact-event log | Key report and aftermath explanation accepted as sufficient for this stage; live notice limitation remains |
| 7 | Character consequence | A battle produces one persistent development fact and follow-up decision | Bruised is prominent and automated, but live notice still did not pass; explanation path retained |
| 8 | Equipment choice | One reward changes the near-term plan rather than adding a generic resource | Implemented; did not solve hero customization alone |
| 9 | Seeded candidate draft | Three deterministic candidates differ mechanically and invite a reasoned favorite or new set | KEEP; human semantic comparison, favorite, risk, and voluntary new-set gates passed; free new sets remain lab-only |
| 10 | Single-candidate combat trial | One selected generated hero makes at least two promised rules visible in a controlled fight | Automated KEEP; controlled battle and exact kit report are ready for the owner gate |
| 11 | Run structure | Route, recruitment, injury, bonds, escalation, and chronicle create a one-more-fight rhythm | Deferred |
| 12 | Emergent narrative | Authored frames render simulation-derived memories and relationships | Deferred |

## Quarantined scope

Procedural quests, a six-chapter compiler, prose-heavy campaign flow, crafting, multiple currencies, world-review screens, meta progression, and broad content expansion are outside the prototype.

## Candidate gate and next risk

- Runtime schemas, compatibility checks, named RNG streams, identity filtering, semantic fingerprints, favorite selection, and new-set generation are implemented.
- The final 100-seed check generated 300 candidates with 298 fingerprints, 36 core builds, minimum distance 3, 93% multi-chassis sets, full required coverage, and no failed set generation.
- Final protection is green: Vitest 98/98, candidate Playwright 3/3, full Playwright 30/30, typecheck/build with 160 modules, and no `Math.random` in authoritative code.
- Human verdict is KEEP: the owner distinguished semantic variance, chose a ramping build for mechanical reasons, identified persistent Strain as a risk, and voluntarily requested a new set.
- Free new sets are a lab tool. Rarity weighting and recruitment costs or resources remain deferred until a real run loop supplies both a source and a sink.
- The same owner supplied this evidence, so fresh sessions remain 1/5 and Phase 2 has not passed. Full roster and recruitment integration remain gated behind the controlled single-candidate trial.
- The controlled trial executes every generated rule family without changing the authored Ada/Bo/Cy battle engine. All 36 core builds and 300 candidates from the 100-seed sample terminate deterministically.
- Candidate battle presentation is causal and report-first: Measured Combo cannot claim unrelated damage, Shared Strain keeps its directly caused Broken result, and the raw event list remains optional.
- The trial is automated KEEP and ready for the owner to name two activated rules, connect one to a number or status, and decide whether the candidate is worth recruiting.
