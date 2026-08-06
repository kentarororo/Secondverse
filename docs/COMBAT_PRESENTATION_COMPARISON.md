# Combat Presentation Comparison

This document makes the open taste decision concrete without selecting it for the owner.

## Shared battlefield hierarchy

Both directions preserve the same information order:

1. **Battlefield:** six large combatant silhouettes and current advantage.
2. **Immediate intent:** next actor, target, and named action.
3. **Survival state:** health, guard, resource, and no more than three visible statuses per unit.
4. **Rule trigger:** one concise signature or policy callout when it changes an action.
5. **Supporting detail:** exact event history available on demand, never the primary spectacle.

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Encounter tell                              Speed · Pause · Audio     │
├──────────────────────── BATTLEFIELD ─────────────────────────────────┤
│  REAR       MID       FRONT        FRONT       MID       REAR        │
│ [hero]     [hero]     [hero]   ⇄   [enemy]    [enemy]   [enemy]      │
│ HP/R        HP/R       HP/R          HP/R       HP/R      HP/R        │
│                 intent → target · named action                       │
│                 signature / policy trigger                           │
├──────────────────────────────────────────────────────────────────────┤
│ Current advantage · next important state · optional exact details    │
└──────────────────────────────────────────────────────────────────────┘
```

## Timing contract

| Beat | Tactical Theatre | Volatile Chorus | Recommended hybrid |
| --- | ---: | ---: | ---: |
| Read intent | 550–800 ms | 250–450 ms | 600 ms |
| Anticipation | 250–400 ms | 100–220 ms | 300 ms |
| Action travel | 250–500 ms | 150–350 ms | 250–450 ms |
| Impact emphasis | 80–140 ms | 120–220 ms | 100 ms normal; 180 ms signature |
| Recovery | 300–500 ms | 160–300 ms | 320 ms |
| Decisive slowdown | Once, strongly signposted | Short repeated accents | Once, plus signature accents |
| Target battle length | 60–75 sec | 45–60 sec | 55–70 sec |

These values are presentation knobs only. Skipping, pausing, or reducing motion cannot alter the authoritative result.

## What the first encounter pair tests

### Encounter 1 — Pressure the Rear

- **Enemy tell:** The attacker marks the rear slot before every third action.
- **Planning question:** Put a durable hero in the rear, use a protection policy, or race the attacker.
- **Readable proof:** The chosen answer must visibly prevent, absorb, or outrun the marked strike.

### Encounter 2 — Punish the Front

- **Enemy tell:** Repeated attacks against the same front target build a visible break threshold.
- **Planning question:** Rotate the formation, prioritize guard, or disrupt the breaker.
- **Readable proof:** The decisive break or its prevention must be identifiable without opening details.

The pair is counterposed: a universally optimal formation should fail. This tests preparation leverage before content breadth.

## Decision matrix

| Priority | Choose |
| --- | --- |
| “I want to feel clever because I predicted the battle.” | Tactical Theatre |
| “I want to be surprised by a hero’s explosive chain reaction.” | Volatile Chorus |
| “Clarity normally; spectacle when a character reveals themselves.” | Recommended hybrid |

## Direction-independent acceptance contract

- Intent always appears before an avoidable or counterable action.
- A signature trigger names the hero and rule in eight words or fewer.
- Damage, healing, guard, and status changes appear at their battlefield source.
- Color is never the only state signal.
- Reduced motion preserves sequence comprehension and final state.
- The result recap cites exact typed events for plan, turning point, and consequence.
- The full event inspector is optional and closed by default.
