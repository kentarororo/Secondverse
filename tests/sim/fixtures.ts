import type {
  BattleFormation,
  AdaStanceId,
  BoStanceId,
  CyStanceId,
  EncounterId,
  HeroId,
  StartBattleCommand,
  TeamPolicyId,
} from "../../src/sim";
import type { EquipmentSelectionId } from "../../src/equipment";
import type { PriorCondition } from "../../src/aftermath";

export const ADA_FRONT: BattleFormation = {
  front: "ada",
  middle: "bo",
  rear: "cy",
};

export const ADA_REAR: BattleFormation = {
  front: "bo",
  middle: "cy",
  rear: "ada",
};

type LegacyTechniquePolicy = "use_early" | "wait_for_need";

interface StanceOverrides {
  readonly ada: AdaStanceId;
  readonly bo: BoStanceId;
  readonly cy: CyStanceId;
}

const legacyStance: Readonly<Record<HeroId, Record<LegacyTechniquePolicy, string>>> = {
  ada: { use_early: "ada_brace_early", wait_for_need: "ada_brace_under_pressure" },
  bo: { use_early: "bo_hit_front", wait_for_need: "bo_finish_weak" },
  cy: { use_early: "cy_aid_one", wait_for_need: "cy_aid_two" },
};

export function command(input: {
  readonly encounterId?: EncounterId;
  readonly formation?: BattleFormation;
  readonly teamPolicy?: TeamPolicyId;
  readonly seed?: string;
  readonly stanceOverrides?: Partial<StanceOverrides>;
  /** Compatibility for unchanged tests outside the stance implementation scope. */
  readonly techniqueOverrides?: Partial<Record<HeroId, LegacyTechniquePolicy>>;
  readonly frontEquipment?: EquipmentSelectionId;
  readonly priorCondition?: PriorCondition | null;
} = {}): StartBattleCommand {
  return {
    type: "start_battle",
    version: 1,
    seed: input.seed ?? "regression-17",
    encounterId: input.encounterId ?? "pressure_rear",
    plan: {
      formation: input.formation ?? ADA_FRONT,
      teamPolicy: input.teamPolicy ?? "cover_rear",
      stances: {
        ada:
          input.stanceOverrides?.ada ??
          (legacyStance.ada[input.techniqueOverrides?.ada ?? "use_early"] as AdaStanceId),
        bo:
          input.stanceOverrides?.bo ??
          (legacyStance.bo[input.techniqueOverrides?.bo ?? "use_early"] as BoStanceId),
        cy:
          input.stanceOverrides?.cy ??
          (legacyStance.cy[input.techniqueOverrides?.cy ?? "use_early"] as CyStanceId),
      },
      frontEquipment: input.frontEquipment ?? "none",
      priorCondition: input.priorCondition ?? null,
    },
  };
}
