import type {
  BattleFormation,
  EncounterId,
  HeroId,
  StartBattleCommand,
  TeamPolicyId,
  TechniquePolicyId,
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

export function command(input: {
  readonly encounterId?: EncounterId;
  readonly formation?: BattleFormation;
  readonly teamPolicy?: TeamPolicyId;
  readonly seed?: string;
  readonly techniqueOverrides?: Partial<Record<HeroId, TechniquePolicyId>>;
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
      techniquePolicies: {
        ada: input.techniqueOverrides?.ada ?? "use_early",
        bo: input.techniqueOverrides?.bo ?? "use_early",
        cy: input.techniqueOverrides?.cy ?? "use_early",
      },
      frontEquipment: input.frontEquipment ?? "none",
      priorCondition: input.priorCondition ?? null,
    },
  };
}
