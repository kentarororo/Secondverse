import type { ActionId, TeamPolicyId } from "../sim";

export const UI_COPY = {
  appName: "Anotherverse combat lab",
  enemyRule: "Enemy rule",
  formation: "Formation",
  teamPolicy: "Team policy",
  stance: "Stance",
  resetPlan: "Reset plan",
  startBattle: "Start battle",
  pauseBattle: "Pause battle",
  resumeBattle: "Resume battle",
  skipResult: "Skip to result",
  exactEvents: "Battle details",
  closeExactEvents: "Close battle details",
  reducedMotion: "Reduced motion",
  result: "Result",
  plan: "Plan",
  turningPoint: "Turning point",
  consequence: "Battle result",
  replay: "Change plan and replay",
  nextEncounter: "Next encounter",
  firstEncounter: "Return to first encounter",
} as const;

export const ACTION_NAMES: Readonly<Record<ActionId, string>> = {
  basic: "Basic hit",
  brace: "Brace",
  heavy_hit: "Heavy Hit",
  first_aid: "First Aid",
  rear_strike: "Marked rear hit",
  line_hit: "Front pressure hit",
};

export const TEAM_POLICY_COPY: Readonly<
  Record<TeamPolicyId, { readonly name: string; readonly effect: string }>
> = {
  hold_front: {
    name: "Hold front",
    effect: "The hero in the front slot starts with 18 Guard.",
  },
  cover_rear: {
    name: "Cover rear",
    effect: "Ada intercepts the marked rear attack while she is alive in the middle slot.",
  },
};
