import { describe, expect, it } from "vitest";
import { COMBAT_TUNING } from "../../src/content";
import {
  FORMATION_SLOTS,
  HERO_IDS,
  TEAM_POLICY_IDS,
  TECHNIQUE_POLICY_IDS,
  simulateBattle,
  type BattleEvent,
  type BattleFormation,
  type EncounterId,
  type HeroId,
  type TechniquePolicyId,
} from "../../src/sim";
import { ADA_FRONT, ADA_REAR, command } from "./fixtures";

function eventsOfKind<Kind extends BattleEvent["kind"]>(
  events: readonly BattleEvent[],
  kind: Kind,
): Extract<BattleEvent, { kind: Kind }>[] {
  return events.filter(
    (event): event is Extract<BattleEvent, { kind: Kind }> => event.kind === kind,
  );
}

describe("deterministic combat", () => {
  it("replays the same command as an identical serializable result", () => {
    const input = command();
    const first = simulateBattle(input);
    const second = simulateBattle(JSON.parse(JSON.stringify(input)) as typeof input);

    expect(second).toEqual(first);
    expect(JSON.parse(JSON.stringify(first))).toEqual(first);
  });

  it("uses valid backward causal links for every caused event", () => {
    const result = simulateBattle(command());
    const eventIndexes = new Map(result.events.map((event) => [event.eventId, event.sequence]));

    for (const event of result.events) {
      if ("causedByEventId" in event) {
        const causeIndex = eventIndexes.get(event.causedByEventId);
        expect(causeIndex, `${event.eventId} cause exists`).toBeDefined();
        expect(causeIndex, `${event.eventId} cause precedes effect`).toBeLessThan(event.sequence);
      }
    }

    expect(new Set(result.events.map((event) => event.eventId)).size).toBe(result.events.length);
    expect(result.events.some((event) => event.eventId === result.highlights.planEventId)).toBe(true);
    expect(result.events.some((event) => event.eventId === result.highlights.turningPointEventId)).toBe(
      true,
    );
    expect(result.events.some((event) => event.eventId === result.highlights.outcomeEventId)).toBe(
      true,
    );
  });

  it("terminates every legal plan inside the action cap", () => {
    const formations: BattleFormation[] = [
      { front: "ada", middle: "bo", rear: "cy" },
      { front: "ada", middle: "cy", rear: "bo" },
      { front: "bo", middle: "ada", rear: "cy" },
      { front: "bo", middle: "cy", rear: "ada" },
      { front: "cy", middle: "ada", rear: "bo" },
      { front: "cy", middle: "bo", rear: "ada" },
    ];
    const encounters: EncounterId[] = ["pressure_rear", "punish_front"];
    const policySets: Array<Readonly<Record<HeroId, TechniquePolicyId>>> = [];

    for (const ada of TECHNIQUE_POLICY_IDS) {
      for (const bo of TECHNIQUE_POLICY_IDS) {
        for (const cy of TECHNIQUE_POLICY_IDS) {
          policySets.push({ ada, bo, cy });
        }
      }
    }

    for (const encounterId of encounters) {
      for (const formation of formations) {
        for (const teamPolicy of TEAM_POLICY_IDS) {
          for (const techniquePolicies of policySets) {
            const result = simulateBattle({
              type: "start_battle",
              version: 1,
              seed: "bounded-matrix",
              encounterId,
              plan: {
                formation,
                teamPolicy,
                techniquePolicies,
                frontEquipment: "none",
                priorCondition: null,
              },
            });
            expect(result.actionCount).toBeLessThanOrEqual(COMBAT_TUNING.actionCap);
            expect(result.events.at(-1)?.kind).toBe("battle_ended");
          }
        }
      }
    }
  });
});

describe("planning leverage", () => {
  const livingHeroCount = (result: ReturnType<typeof simulateBattle>): number =>
    result.finalUnits.filter((unit) => unit.side === "heroes" && !unit.defeated).length;

  it("changes the marked rear target when only formation changes", () => {
    const adaFront = simulateBattle(command({ formation: ADA_FRONT, teamPolicy: "hold_front" }));
    const adaRear = simulateBattle(command({ formation: ADA_REAR, teamPolicy: "hold_front" }));
    const frontMark = eventsOfKind(adaFront.events, "target_marked")[0];
    const rearMark = eventsOfKind(adaRear.events, "target_marked")[0];

    expect(frontMark?.targetId).toBe("cy");
    expect(rearMark?.targetId).toBe("ada");
    expect(adaFront.highlights.turningPointEventId).not.toBe(adaRear.highlights.turningPointEventId);
  });

  it("changes front pressure when only formation changes", () => {
    const adaFront = simulateBattle(
      command({ encounterId: "punish_front", formation: ADA_FRONT, teamPolicy: "hold_front" }),
    );
    const cyFrontFormation: BattleFormation = { front: "cy", middle: "bo", rear: "ada" };
    const cyFront = simulateBattle(
      command({
        encounterId: "punish_front",
        formation: cyFrontFormation,
        teamPolicy: "hold_front",
      }),
    );

    const adaLineHit = eventsOfKind(adaFront.events, "intent_shown").find(
      (event) => event.actionId === "line_hit",
    );
    const cyLineHit = eventsOfKind(cyFront.events, "intent_shown").find(
      (event) => event.actionId === "line_hit",
    );
    expect(adaLineHit?.targetIds).toEqual(["ada"]);
    expect(cyLineHit?.targetIds).toEqual(["cy"]);
    expect(adaFront.finalUnits).not.toEqual(cyFront.finalUnits);
  });

  it("marks the rear on each third Rear Attacker action", () => {
    const result = simulateBattle(command({ formation: ADA_REAR, teamPolicy: "hold_front" }));
    const attackerActions = eventsOfKind(result.events, "action_started").filter(
      (event) => event.actorId === "rear_attacker",
    );
    const markedActionNumbers = attackerActions
      .map((event, index) => ({ actionNumber: index + 1, actionId: event.actionId }))
      .filter(({ actionId }) => actionId === "rear_strike")
      .map(({ actionNumber }) => actionNumber);

    expect(markedActionNumbers.length).toBeGreaterThan(0);
    expect(markedActionNumbers.every((actionNumber) => actionNumber % 3 === 0)).toBe(true);
  });

  it("breaks the front only when visible strain reaches its threshold", () => {
    const result = simulateBattle(
      command({ encounterId: "punish_front", formation: ADA_FRONT, teamPolicy: "hold_front" }),
    );
    const breaks = eventsOfKind(result.events, "front_broken");
    const strainById = new Map(
      eventsOfKind(result.events, "strain_changed").map((event) => [event.eventId, event]),
    );

    expect(breaks.length).toBeGreaterThan(0);
    for (const event of breaks) {
      const thresholdEvent = strainById.get(event.causedByEventId);
      expect(thresholdEvent?.strainAfter).toBe(thresholdEvent?.threshold);
    }
  });

  it("intercepts the marked strike when only team policy changes", () => {
    const coverFormation: BattleFormation = { front: "bo", middle: "ada", rear: "cy" };
    const cover = simulateBattle(
      command({ formation: coverFormation, teamPolicy: "cover_rear" }),
    );
    const hold = simulateBattle(command({ formation: coverFormation, teamPolicy: "hold_front" }));

    expect(eventsOfKind(cover.events, "target_changed")).toContainEqual(
      expect.objectContaining({ fromTargetId: "cy", toTargetId: "ada", reason: "cover_rear" }),
    );
    expect(eventsOfKind(hold.events, "target_changed")).toHaveLength(0);
    expect(eventsOfKind(cover.events, "damage_applied").some((event) => event.targetId === "ada"))
      .toBe(true);
  });

  it("changes technique timing when only one hero policy changes", () => {
    const safeAda: BattleFormation = { front: "bo", middle: "ada", rear: "cy" };
    const early = simulateBattle(
      command({ formation: safeAda, teamPolicy: "hold_front", techniqueOverrides: { ada: "use_early" } }),
    );
    const wait = simulateBattle(
      command({
        formation: safeAda,
        teamPolicy: "hold_front",
        techniqueOverrides: { ada: "wait_for_need" },
      }),
    );
    const braceSequence = (events: readonly BattleEvent[]): number | null =>
      eventsOfKind(events, "action_started").find((event) => event.actionId === "brace")
        ?.sequence ?? null;

    expect(braceSequence(early.events)).not.toBe(braceSequence(wait.events));
  });

  it("has no single safe formation across the encounter pair", () => {
    const pressureFormation: BattleFormation = { front: "bo", middle: "ada", rear: "cy" };
    const rearAnswer = simulateBattle(
      command({
        encounterId: "pressure_rear",
        formation: pressureFormation,
        teamPolicy: "cover_rear",
      }),
    );
    const defaultPressure = simulateBattle(
      command({ encounterId: "pressure_rear", formation: ADA_FRONT, teamPolicy: "cover_rear" }),
    );
    const frontAnswer = simulateBattle(
      command({ encounterId: "punish_front", formation: ADA_FRONT, teamPolicy: "hold_front" }),
    );
    const defaultFront = simulateBattle(
      command({ encounterId: "punish_front", formation: ADA_REAR, teamPolicy: "hold_front" }),
    );

    expect(livingHeroCount(rearAnswer)).toBeGreaterThan(livingHeroCount(defaultPressure));
    expect(rearAnswer.winner).toBe("heroes");
    expect(frontAnswer.winner).toBe("heroes");
    expect(defaultFront.winner).toBe("enemies");
  });

  it("emits action options with legal conditions and scores before each intent", () => {
    const result = simulateBattle(command());
    const options = eventsOfKind(result.events, "action_options");
    const intents = eventsOfKind(result.events, "intent_shown");

    expect(options).toHaveLength(result.actionCount);
    expect(intents).toHaveLength(result.actionCount);
    for (const actorOptions of options) {
      expect(actorOptions.options.some((option) => option.legal && option.score > 0)).toBe(true);
      const nextIntent = intents.find(
        (intent) => intent.actorId === actorOptions.actorId && intent.sequence > actorOptions.sequence,
      );
      expect(nextIntent).toBeDefined();
    }
  });

  it("records authored signature rules as causal facts", () => {
    const pressureFormation: BattleFormation = { front: "bo", middle: "ada", rear: "cy" };
    const result = simulateBattle(
      command({
        encounterId: "pressure_rear",
        formation: pressureFormation,
        teamPolicy: "cover_rear",
      }),
    );
    const signatures = eventsOfKind(result.events, "signature_triggered");

    expect(signatures).toContainEqual(
      expect.objectContaining({ actorId: "ada", signatureName: "Step In", effect: "intercept" }),
    );
    expect(signatures).toContainEqual(
      expect.objectContaining({ actorId: "bo", signatureName: "Follow Up", effect: "low_health_damage" }),
    );
    expect(signatures).toContainEqual(
      expect.objectContaining({ actorId: "cy", signatureName: "Quick Help", effect: "low_health_guard" }),
    );
  });
});

describe("formation contract", () => {
  it("contains exactly the authored heroes and named slots", () => {
    expect(HERO_IDS).toEqual(["ada", "bo", "cy"]);
    expect(FORMATION_SLOTS).toEqual(["front", "middle", "rear"]);
  });
});
