import { create } from "zustand";
import { deriveAftermath, type AftermathFact, type PriorCondition } from "../aftermath";
import type { EquipmentId, EquipmentSelectionId } from "../equipment";
import type { CombatLabSave, SaveReadResult, SaveRepository, SaveWriteResult } from "../save";
import { createDefaultCombatLabSave } from "../save";
import type {
  BattlePlan,
  BattleResult,
  EncounterId,
  FormationSlot,
  HeroId,
  TeamPolicyId,
  TechniquePolicyId,
} from "../sim";

type Screen = "prepare" | "battle" | "result";
type PlaybackSpeed = 1 | 1.5 | 2;

export const DEFAULT_PLAN: BattlePlan = {
  formation: { front: "ada", middle: "cy", rear: "bo" },
  teamPolicy: "hold_front",
  techniquePolicies: {
    ada: "wait_for_need",
    bo: "use_early",
    cy: "wait_for_need",
  },
  frontEquipment: "none",
  priorCondition: null,
};

function systemPrefersReducedMotion(): boolean {
  return typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface ProgressState {
  readonly pressureRearCompleted: boolean;
  readonly punishFrontCompleted: boolean;
}

interface StudioState {
  readonly screen: Screen;
  readonly encounterId: EncounterId;
  readonly plan: BattlePlan;
  readonly selectedHeroId: HeroId;
  readonly result: BattleResult | null;
  readonly playbackCursor: number;
  readonly playing: boolean;
  readonly speed: PlaybackSpeed;
  readonly muted: boolean;
  readonly reducedMotion: boolean;
  readonly inspectorOpen: boolean;
  readonly focusedEventId: string | null;
  readonly selectedEquipment: EquipmentSelectionId;
  readonly aftermathFact: AftermathFact | null;
  readonly aftermathCondition: PriorCondition | null;
  readonly rewardSelection: EquipmentId | null;
  readonly progress: ProgressState;
  readonly saveHydrated: boolean;
  readonly saveRecoveryMessage: string | null;
  readonly saveNotice: string | null;
  selectHero: (heroId: HeroId) => void;
  moveHero: (heroId: HeroId, toSlot: FormationSlot) => void;
  setTeamPolicy: (policyId: TeamPolicyId) => void;
  setTechniquePolicy: (heroId: HeroId, policyId: TechniquePolicyId) => void;
  resetPlan: () => void;
  beginBattle: (result: BattleResult) => void;
  setPlaybackCursor: (cursor: number) => void;
  setPlaying: (playing: boolean) => void;
  setSpeed: (speed: PlaybackSpeed, repository?: SaveRepository<CombatLabSave>) => void;
  setMuted: (muted: boolean, repository?: SaveRepository<CombatLabSave>) => void;
  setReducedMotion: (
    reducedMotion: boolean,
    repository?: SaveRepository<CombatLabSave>,
  ) => void;
  openInspector: (focusedEventId?: string) => void;
  closeInspector: () => void;
  showResult: (repository?: SaveRepository<CombatLabSave>) => void;
  selectEquipmentReward: (equipmentId: EquipmentId) => void;
  confirmEquipmentReward: (repository: SaveRepository<CombatLabSave>) => SaveWriteResult;
  replayToPrepare: () => void;
  nextEncounter: () => void;
  applySaveRead: (read: SaveReadResult<CombatLabSave>) => void;
  clearSavedData: (repository: SaveRepository<CombatLabSave>) => SaveWriteResult;
  continueClean: () => void;
  dismissSaveNotice: () => void;
  resetLab: () => void;
}

function clonePlan(plan: BattlePlan): BattlePlan {
  return {
    formation: { ...plan.formation },
    teamPolicy: plan.teamPolicy,
    techniquePolicies: { ...plan.techniquePolicies },
    frontEquipment: plan.frontEquipment,
    priorCondition: plan.priorCondition,
  };
}

function initialState() {
  return {
    screen: "prepare" as const,
    encounterId: "pressure_rear" as const,
    plan: clonePlan(DEFAULT_PLAN),
    selectedHeroId: "ada" as const,
    result: null,
    playbackCursor: 0,
    playing: true,
    speed: 1 as const,
    muted: false,
    reducedMotion: systemPrefersReducedMotion(),
    inspectorOpen: false,
    focusedEventId: null,
    selectedEquipment: "none" as const,
    aftermathFact: null,
    aftermathCondition: null,
    rewardSelection: null,
    progress: { pressureRearCompleted: false, punishFrontCompleted: false },
    saveHydrated: false,
    saveRecoveryMessage: null,
    saveNotice: null,
  };
}

function saveValue(
  state: Pick<
    StudioState,
    | "selectedEquipment"
    | "aftermathCondition"
    | "progress"
    | "reducedMotion"
    | "muted"
    | "speed"
  >,
  overrides: Partial<CombatLabSave> = {},
): CombatLabSave {
  return {
    ...createDefaultCombatLabSave(),
    selectedEquipment: state.selectedEquipment,
    aftermathCondition: state.aftermathCondition,
    progress: { ...state.progress },
    preferences: {
      reducedMotion: state.reducedMotion,
      audioEnabled: !state.muted,
      battleSpeed: state.speed,
    },
    ...overrides,
  };
}

function writeNotice(result: SaveWriteResult): string | null {
  return result.ok ? null : result.message;
}

export const useStudioStore = create<StudioState>((set, get) => ({
  ...initialState(),
  selectHero: (selectedHeroId) => set({ selectedHeroId }),
  moveHero: (heroId, toSlot) =>
    set((state) => {
      const entries = Object.entries(state.plan.formation) as [FormationSlot, HeroId][];
      const fromEntry = entries.find(([, placedHeroId]) => placedHeroId === heroId);
      if (!fromEntry || fromEntry[0] === toSlot) return state;
      const fromSlot = fromEntry[0];
      const displacedHero = state.plan.formation[toSlot];
      return {
        plan: {
          ...state.plan,
          formation: {
            ...state.plan.formation,
            [fromSlot]: displacedHero,
            [toSlot]: heroId,
          },
        },
      };
    }),
  setTeamPolicy: (teamPolicy) =>
    set((state) => ({ plan: { ...state.plan, teamPolicy } })),
  setTechniquePolicy: (heroId, policyId) =>
    set((state) => ({
      plan: {
        ...state.plan,
        techniquePolicies: { ...state.plan.techniquePolicies, [heroId]: policyId },
      },
    })),
  resetPlan: () =>
    set((state) => ({
      plan: {
        ...clonePlan(DEFAULT_PLAN),
        frontEquipment:
          state.encounterId === "punish_front" ? state.selectedEquipment : "none",
        priorCondition:
          state.encounterId === "punish_front" ? state.aftermathCondition : null,
      },
      selectedHeroId: "ada",
    })),
  beginBattle: (result) =>
    set({
      result,
      screen: "battle",
      playbackCursor: 0,
      playing: true,
      inspectorOpen: false,
      focusedEventId: null,
      rewardSelection: null,
      aftermathFact: null,
    }),
  setPlaybackCursor: (playbackCursor) => set({ playbackCursor }),
  setPlaying: (playing) => set({ playing }),
  setSpeed: (speed, repository) =>
    set((state) => {
      const next = { ...state, speed };
      const write = repository?.save(saveValue(next));
      return { speed, ...(write ? { saveNotice: writeNotice(write) } : {}) };
    }),
  setMuted: (muted, repository) =>
    set((state) => {
      const next = { ...state, muted };
      const write = repository?.save(saveValue(next));
      return { muted, ...(write ? { saveNotice: writeNotice(write) } : {}) };
    }),
  setReducedMotion: (reducedMotion, repository) =>
    set((state) => {
      const next = { ...state, reducedMotion };
      const write = repository?.save(saveValue(next));
      return { reducedMotion, ...(write ? { saveNotice: writeNotice(write) } : {}) };
    }),
  openInspector: (focusedEventId) =>
    set({ inspectorOpen: true, focusedEventId: focusedEventId ?? null }),
  closeInspector: () => set({ inspectorOpen: false, focusedEventId: null }),
  showResult: (repository) =>
    set((state) => {
      if (state.result?.command.encounterId !== "punish_front") {
        return {
          screen: "result",
          playing: false,
          inspectorOpen: false,
          aftermathFact:
            state.result?.command.encounterId === "pressure_rear"
              ? deriveAftermath(state.result)
              : state.aftermathFact,
        };
      }
      const progress = { ...state.progress, punishFrontCompleted: true };
      const next = { ...state, progress };
      const write = repository?.save(saveValue(next));
      return {
        screen: "result",
        playing: false,
        inspectorOpen: false,
        progress,
        ...(write ? { saveNotice: writeNotice(write) } : {}),
      };
    }),
  selectEquipmentReward: (rewardSelection) => set({ rewardSelection }),
  confirmEquipmentReward: (repository) => {
    const state = get();
    if (!state.rewardSelection) {
      return {
        ok: false,
        reason: "invalid_value",
        message: "Choose equipment before confirming.",
      };
    }
    const selectedEquipment = state.rewardSelection;
    const aftermathCondition =
      state.aftermathFact?.kind === "bruised" ? state.aftermathFact : null;
    const progress = { ...state.progress, pressureRearCompleted: true };
    const write = repository.save(
      saveValue(
        { ...state, selectedEquipment, aftermathCondition, progress },
        { selectedEquipment, aftermathCondition, progress },
      ),
    );
    set({
      selectedEquipment,
      aftermathCondition,
      progress,
      saveNotice: writeNotice(write),
    });
    return write;
  },
  replayToPrepare: () =>
    set((state) => ({
      screen: "prepare",
      result: null,
      playbackCursor: 0,
      playing: true,
      inspectorOpen: false,
      focusedEventId: null,
      rewardSelection: null,
      plan: {
        ...state.plan,
        frontEquipment:
          state.encounterId === "punish_front" ? state.selectedEquipment : "none",
        priorCondition:
          state.encounterId === "punish_front" ? state.aftermathCondition : null,
      },
    })),
  nextEncounter: () =>
    set((state) => {
      if (
        state.encounterId === "pressure_rear" &&
        (!state.progress.pressureRearCompleted || state.selectedEquipment === "none")
      ) {
        return state;
      }
      const encounterId =
        state.encounterId === "pressure_rear" ? "punish_front" : "pressure_rear";
      return {
        screen: "prepare",
        encounterId,
        result: null,
        playbackCursor: 0,
        playing: true,
        inspectorOpen: false,
        focusedEventId: null,
        rewardSelection: null,
        plan: {
          ...state.plan,
          frontEquipment:
            encounterId === "punish_front" ? state.selectedEquipment : "none",
          priorCondition:
            encounterId === "punish_front" ? state.aftermathCondition : null,
        },
      };
    }),
  applySaveRead: (read) => {
    if (read.status === "recoverable_error") {
      set({
        saveHydrated: true,
        saveRecoveryMessage: read.message,
        saveNotice: null,
      });
      return;
    }
    if (read.status === "empty") {
      set({ saveHydrated: true, saveRecoveryMessage: null });
      return;
    }
    const save = read.value;
    const resumesSecond =
      save.progress.pressureRearCompleted && save.selectedEquipment !== "none";
    set({
      saveHydrated: true,
      saveRecoveryMessage: null,
      saveNotice: null,
      encounterId: resumesSecond ? "punish_front" : "pressure_rear",
      selectedEquipment: save.selectedEquipment,
      aftermathCondition: save.aftermathCondition,
      aftermathFact: null,
      progress: { ...save.progress },
      reducedMotion: save.preferences.reducedMotion,
      muted: !save.preferences.audioEnabled,
      speed: save.preferences.battleSpeed,
      plan: {
        ...clonePlan(DEFAULT_PLAN),
        frontEquipment: resumesSecond ? save.selectedEquipment : "none",
        priorCondition: resumesSecond ? save.aftermathCondition : null,
      },
    });
  },
  clearSavedData: (repository) => {
    const write = repository.clear();
    if (write.ok) {
      set({ ...initialState(), saveHydrated: true });
    } else {
      set({ saveRecoveryMessage: write.message });
    }
    return write;
  },
  continueClean: () => set({ ...initialState(), saveHydrated: true }),
  dismissSaveNotice: () => set({ saveNotice: null }),
  resetLab: () => set(initialState()),
}));
