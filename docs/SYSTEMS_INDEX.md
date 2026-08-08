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
| 9 | Seeded candidate draft | Three deterministic candidates differ mechanically and invite a reasoned favorite or new set | Implementation complete; automated KEEP; comparison-only and not fieldable; READY FOR OWNER PLAYTEST |
| 10 | Run structure | Route, recruitment, injury, bonds, escalation, and chronicle create a one-more-fight rhythm | Deferred |
| 11 | Emergent narrative | Authored frames render simulation-derived memories and relationships | Deferred |

## Quarantined scope

Procedural quests, a six-chapter compiler, prose-heavy campaign flow, crafting, multiple currencies, world-review screens, meta progression, and broad content expansion are outside the prototype.

## Current candidate gate

- Runtime schemas, compatibility checks, named RNG streams, identity filtering, semantic fingerprints, favorite selection, and new-set generation are implemented.
- The final 100-seed check generated 300 candidates with 298 fingerprints, 36 core builds, minimum distance 3, 93% multi-chassis sets, full required coverage, and no failed set generation.
- Final protection is green: Vitest 98/98, candidate Playwright 3/3, full Playwright 30/30, typecheck/build with 160 modules, and no `Math.random` in authoritative code.
- Human preference remains unproven. Fresh sessions are 1/5, Phase 2 has not passed, and candidate combat integration remains gated.
