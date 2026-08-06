import type { ActionId, TeamPolicyId, TechniquePolicyId } from "../sim";

export const UI_COPY = {
  appName: "Anotherverse combat lab",
  enemyRule: "Enemy rule",
  formation: "Formation",
  teamPolicy: "Team policy",
  techniquePolicy: "Technique policy",
  resetPlan: "Reset plan",
  startBattle: "Start battle",
  pauseBattle: "Pause battle",
  resumeBattle: "Resume battle",
  skipResult: "Skip to result",
  exactEvents: "Exact events",
  closeExactEvents: "Close exact events",
  reducedMotion: "Reduced motion",
  result: "Result",
  plan: "Plan",
  turningPoint: "Turning point",
  consequence: "Consequence",
  replay: "Change plan and replay",
  nextEncounter: "Next encounter",
  firstEncounter: "Return to first encounter",
} as const;

export const ACTION_NAMES: Readonly<Record<ActionId, string>> = {
  basic: "Basic hit",
  brace: "Brace",
  heavy_hit: "Heavy hit",
  first_aid: "First aid",
  rear_strike: "Marked rear hit",
  line_hit: "Front pressure hit",
};

export const TEAM_POLICY_COPY: Readonly<
  Record<TeamPolicyId, { readonly name: string; readonly effect: string }>
> = {
  hold_front: {
    name: "Hold front",
    effect: "The front hero starts with 18 guard.",
  },
  cover_rear: {
    name: "Cover rear",
    effect: "Ada intercepts a marked rear hit while she is alive in middle.",
  },
};

export const TECHNIQUE_POLICY_COPY: Readonly<
  Record<TechniquePolicyId, { readonly name: string; readonly effect: string }>
> = {
  use_early: {
    name: "Use early",
    effect: "Use the technique when 2 points are ready.",
  },
  wait_for_need: {
    name: "Wait for need",
    effect: "Wait for its useful condition, then use by 3 points.",
  },
};
