# First Encounter Pair UX Specification

**Status:** Implementation-ready draft  
**Scope:** Combat laboratory only  
**Target:** Browser, desktop `1365 x 768` and mobile `390 x 844`  
**Direction:** Clear ordinary action; restrained extra emphasis for typed signature and decisive events  
**Language:** Plain, concrete, localization-ready copy

## 1. Player job and test question

The player reads an enemy rule, changes a three-person plan, watches the result on the battlefield, understands the turning point, takes one equipment reward, and tries the counterposed encounter. The pair must fit a first session of three to five minutes.

The experience question is:

> Can the player see that preparation changed the fight without relying on a long event log?

This specification does not define combat results. It only renders typed simulation facts and emits player commands.

## 2. Scope and exclusions

### Included

- One authored team and two encounters.
- Front, middle, and rear formation slots.
- One team policy choice and one of two validated stances per hero.
- A battlefield-first automatic battle.
- Pause, speed, skip to result, mute, reduced-motion-compatible playback, and an optional exact event inspector.
- A three-part result explanation: plan, turning point, consequence.
- One equipment reward choice.
- Replay or continue to the counterposed encounter.

### Excluded

- Roster generation, campaign map, crafting, currencies, relationship screens, broad inventory management, lore archive, and meta progression.
- Player control during authoritative combat.
- A scrolling combat log as the primary view.
- UI-authored tactical claims, causal explanations, decisive moments, or reward outcomes.

## 3. Session flow and time budget

| Step | Player action | Target time | Exit condition |
| --- | --- | ---: | --- |
| Encounter 1 read | Read the enemy tell and reward category | 10-15 sec | Player enters preparation |
| Encounter 1 prepare | Change formation and policies, or keep the starting plan | 30-45 sec | Player selects **Start battle** |
| Encounter 1 battle | Watch normal-speed Key moments playback | 35-75 sec | Outcome moment is rendered |
| Result and reward | Read three facts and choose one item | 20-30 sec | Player selects **Next encounter** |
| Encounter 2 read/prepare | Read the changed threat and revise the plan | 20-35 sec | Player selects **Start battle** |
| Encounter 2 battle | Watch normal-speed Key moments playback | 35-75 sec | Outcome moment is rendered |
| Final result | Read three facts and choose replay or finish | 15-25 sec | Player chooses an action |

**Pair target:** 205-290 seconds. Playback speed changes may shorten the session but never alter simulation facts.

## 4. Information order

Every screen follows this priority:

1. The battlefield or formation is the largest region.
2. The current threat or immediate action is next.
3. Health, guard, resource, and status state supports the action.
4. A signature or policy callout appears only when its typed trigger changes an action.
5. Exact event data remains available on demand and closed by default.

No screen may give more area to explanation text than to the formation or battlefield.

## 5. Flow states

```text
LOAD ENCOUNTER
      |
      v
PREPARE -- reset plan --> PREPARE
      |
      | Start battle(command snapshot)
      v
BATTLE <---- pause / resume / speed ----> BATTLE
      |                                      |
      | final typed event or skip            | open exact events
      v                                      v
RESULT <------------------------------- INSPECTOR OVERLAY
      |
      +-- choose equipment --> REWARD CONFIRMED
                                   |
                   +---------------+---------------+
                   |                               |
             next encounter                    replay
                   |                               |
                PREPARE                         PREPARE
```

The inspector is a view over the current replay. Opening, filtering, or closing it does not change combat state.

## 6. Desktop layout (`1365 x 768`)

Use a 12-column grid, 24 px outer margin, 16 px gutter. The main application region fills the viewport; do not require page scrolling during battle.

### 6.1 Prepare

```text
+----------------------------------------------------------------------------------+
| Encounter 1 of 2 | Pressure the Rear                              Settings       |
| ENEMY RULE: Rear slot is marked before every third action.   Reward: Equipment   |
+------------------------------------------------------+---------------------------+
|                                                      | PLAN                      |
|                FORMATION FIELD                       | Team policy [ selector ]  |
|                                                      |                           |
|       [REAR]       [MIDDLE]       [FRONT]             | SELECTED HERO              |
|       [hero]        [hero]         [hero]             | Name / role / health       |
|       HP + stance   HP + stance    HP + stance        | Stance [ two choices ]     |
|                                                      | Rule in one short line     |
|  Select a hero, then Move left / Move right.          |                           |
|                                                      | [Reset plan]               |
+------------------------------------------------------+---------------------------+
| Plan summary: Rear: ___ | Team policy: ___           | [Start battle]             |
+----------------------------------------------------------------------------------+
```

- Formation field: columns 1-8, minimum 620 px wide.
- Plan panel: columns 9-12, 320-380 px wide.
- Enemy rule is always visible above the formation, never hidden in a tooltip.
- Each hero card has a visible slot label, position number, and selected stance in addition to spatial placement.
- Selecting a hero updates the plan panel; selection does not reorder the team.
- The selected hero exposes exactly two radio choices from its validated stance definitions. Each choice shows its full trigger, target, point cost, and effect forecast without hover.
- Team policy stays separate from hero stance. Any hero or slot requirement is stated in the option text.
- Reordering supports drag, pointer/touch move buttons, and keyboard commands. Drag is never the sole method.

### 6.2 Battle

- **Key moments** and **Every action** sit beside the enemy rule as a two-state, reversible control. Key moments is selected on entry.
- The battlefield is followed by one dominant cause-to-result moment card and one quieter three-item Plan tracker. Exact events remains a separate optional control below them.
- The moment card shows displayed-moment progress and, when applicable, the count of routine actions advanced since the prior displayed moment.

```text
+----------------------------------------------------------------------------------+
| Pressure the Rear | Enemy rule: marks rear every third action [1x] [||] [skip] [sound]|
+----------------------------------------------------------------------------------+
|                                                                                  |
|                         BATTLEFIELD (about 72% height)                            |
|                                                                                  |
|  REAR        MIDDLE       FRONT             FRONT       MIDDLE       REAR         |
| [hero]       [hero]       [hero]             [foe]       [foe]       [foe]        |
| HP / guard   HP / guard   HP / guard        HP / guard  HP / guard  HP / guard   |
| status text  status text  status text       status text status text status text  |
|                                                                                  |
|                   actor --> target | action name                                 |
|                   signature or policy callout, when supplied                     |
|                                                                                  |
+----------------------------------------------------------------------------------+
| Current fact: short concrete event text           [Exact events]   Event 18 / 42  |
+----------------------------------------------------------------------------------+
```

- Battlefield: at least 70% of usable vertical space and at least 75% of usable width.
- Combatants remain in stable lanes during ordinary action. Temporary travel returns them to the source lane unless a typed movement event changes formation.
- The active actor receives an outline plus the text label **Acting**. The target receives a different outline plus **Target**. Color may reinforce these states but cannot define them alone.
- Intent appears near the actor-to-target path and remains readable without following moving objects.
- Exact events opens a side sheet up to 420 px wide. It may cover the right edge but must not resize or restart playback.
- **Skip to result** advances presentation directly to the supplied final state and result facts. It does not stop, shorten, or recalculate authoritative simulation.

### 6.3 Result and reward

```text
+----------------------------------------------------------------------------------+
| Result: Win / Loss                                            Encounter 1 of 2    |
+-----------------------------------------------+----------------------------------+
|                                               | WHAT CHANGED                     |
|            FINAL BATTLEFIELD                  | Plan: [typed fact]               |
|            (frozen end state)                 | Turning point: [typed fact]      |
|                                               | Consequence: [typed fact]        |
|                                               | [Show exact event]               |
+-----------------------------------------------+----------------------------------+
| Choose one item: [item fact card] [item fact card]             [Confirm choice]  |
| After confirm: [Replay] [Next encounter]                                            |
+----------------------------------------------------------------------------------+
```

- The final battlefield remains larger than the explanation panel.
- Each explanation row links to one exact event ID. **Show exact event** opens the inspector focused on that event.
- Reward cards compare only supplied item facts. The UI does not add value labels such as “best” or “rare” unless they are typed content facts.
- Confirmation is required only for the equipment choice; replay and next encounter are direct actions.

## 7. Mobile layout (`390 x 844`)

Use a 4-column grid, 16 px outer margin, 12 px gutter. Respect safe-area insets. Core controls stay at least 44 x 44 CSS px.

### 7.1 Prepare

```text
+--------------------------------------+
| 1 of 2              Settings         |
| Pressure the Rear                    |
| Rear is marked every third action.   |
+--------------------------------------+
| FORMATION                            |
| [REAR 3] [hero card, one line]       |
| [MID  2] [hero card, one line]       |
| [FRONT1] [hero card, one line]       |
|                                      |
| Selected: Hero name                  |
| [Move toward rear] [Move to front]   |
+--------------------------------------+
| Team policy [full-width selector]    |
| Hero stance [two full-width choices] |
| [Start battle - sticky]              |
+--------------------------------------+
```

- The formation remains visible above policy controls.
- Hero cards are rows, not tiny side-view figures. Slot order is explicit.
- Every hero row keeps its selected stance visible; selecting the row exposes that hero's two exact stance choices below.
- Drag is optional. Tapping a hero then a move button is the primary touch path.
- The start button may be sticky above the safe-area inset but must not cover content or focused controls.

### 7.2 Battle

- The playback-mode buttons remain full text and at least 44 px high.
- The current moment chain stacks cause, target, and result vertically. The three Plan tracker items stack below it; no hero or exact activation effect is hidden.
- Bruised remains visible at its unit during Punish and is not replaced by the Plan tracker.

```text
+--------------------------------------+
| Pressure the Rear   [||] [1x] [skip] |
| Rear marked every third action.      |
+--------------------------------------+
|                                      |
|       ENEMY REAR / MID / FRONT       |
|        [foe]   [foe]   [foe]         |
|                                      |
|             BATTLEFIELD              |
|                                      |
|        [hero]  [hero]  [hero]        |
|       PLAYER FRONT / MID / REAR      |
|                                      |
| actor -> target                      |
| action name                          |
+--------------------------------------+
| Current fact, maximum two lines      |
| [Exact events]             18 / 42   |
+--------------------------------------+
```

- Mobile uses a stacked battlefield so figures remain at least 56 px wide at base text size.
- Player and enemy lane labels stay visible. The screen-reader order is encounter rule, controls, enemy front-to-rear, player front-to-rear, current intent, current event.
- HP and guard are adjacent to each unit; selecting a unit opens a compact state sheet with exact values and statuses.
- During ordinary playback no bottom navigation or secondary tabs are shown.
- The exact event inspector is a bottom sheet with a 90% viewport-height maximum and a visible close control.

### 7.3 Result

The frozen battlefield appears first at 35-40% viewport height. The three result facts follow in a single column, then horizontally scroll-free item cards, then replay/next actions. The page may scroll. Focus moves to the result heading, not to the bottom action.

## 8. Responsive and 125% text behavior

- The layout must work with browser text zoom set to 125% at both target viewports.
- Desktop may reduce the plan panel to 300 px and wrap controls to two lines; it may not hide the enemy rule, unit values, intent, or battle controls.
- At 125%, player-facing text never clips, ellipsizes a mechanical rule, or overlaps a control. Names may wrap to two lines. If a supplied name exceeds its budget, use a two-line wrap and expose the full name to assistive technology.
- Mobile switches to the stacked layouts above. Do not scale the entire UI down to fit.
- No horizontal page scroll at either target or text size.
- Inspector tables may use internal horizontal scrolling only for developer-only IDs; all player-facing fact text wraps.

## 9. Component contracts

The UI layer receives immutable view data and emits commands. It never computes damage, targeting, trigger eligibility, decisive moments, item effects, or results.

### 9.1 Required view models

```ts
type LocalizationText = {
  key: string;
  params?: Readonly<Record<string, string | number>>;
};

type EncounterHeaderView = {
  encounterId: string;
  ordinal: number;
  total: number;
  name: LocalizationText;
  enemyRule: LocalizationText;
  rewardCategory: LocalizationText;
};

type UnitPlanView = {
  unitId: string;
  name: LocalizationText;
  role: LocalizationText;
  slot: "front" | "middle" | "rear";
  healthCurrent: number;
  healthMax: number;
  ruleSummary: LocalizationText;
  techniqueOptions: readonly PolicyOptionView[];
  selectedTechniqueId: string;
};

type PreparationView = {
  encounter: EncounterHeaderView;
  units: readonly UnitPlanView[];
  teamPolicyOptions: readonly PolicyOptionView[];
  selectedTeamPolicyId: string;
  canStart: boolean;
  validationMessage?: LocalizationText;
};

type PolicyOptionView = {
  id: string;
  name: LocalizationText;
  effect: LocalizationText;
  selected: boolean;
  unavailableReason?: LocalizationText;
};

type BattleUnitView = {
  unitId: string;
  side: "player" | "enemy";
  slot: "front" | "middle" | "rear";
  name: LocalizationText;
  healthCurrent: number;
  healthMax: number;
  guardCurrent: number;
  resourceCurrent: number;
  resourceMax: number;
  statuses: readonly StatusFactView[];
  defeated: boolean;
};

type BattlePresentationEvent = {
  eventId: string;
  sequence: number;
  atMs: number;
  kind: string;
  actorId?: string;
  targetIds: readonly string[];
  actionName?: LocalizationText;
  exactFact: LocalizationText;
  numericChanges: readonly NumericChangeView[];
  emphasis: "normal" | "signature" | "decisive";
  signatureCallout?: LocalizationText;
  resultingUnits: readonly BattleUnitView[];
};

type BattleReplayView = {
  battleId: string;
  seedLabel: string;
  encounter: EncounterHeaderView;
  initialUnits: readonly BattleUnitView[];
  events: readonly BattlePresentationEvent[];
  durationMs: number;
};

type ResultView = {
  battleId: string;
  outcome: "win" | "loss" | "draw";
  finalUnits: readonly BattleUnitView[];
  planFact: ResultFactView;
  turningPointFact: ResultFactView;
  consequenceFact: ResultFactView;
  rewards: readonly RewardOptionView[];
  selectedRewardId?: string;
  canContinue: boolean;
};

type ResultFactView = {
  text: LocalizationText;
  sourceEventId: string;
};
```

`NumericChangeView`, `StatusFactView`, and `RewardOptionView` must contain stable IDs, localization keys/parameters, and exact values supplied by simulation/content. The UI may format supplied values but may not infer them.

### 9.2 Emitted commands and UI events

| Event | Payload | Owner | Notes |
| --- | --- | --- | --- |
| `formationMoveRequested` | `{ unitId, toSlot }` | App command handler | Rejected moves return a typed validation fact |
| `teamPolicySelected` | `{ policyId }` | App command handler | UI does not apply effects |
| `techniquePolicySelected` | `{ unitId, policyId }` | App command handler | UI does not apply effects |
| `planResetRequested` | `{ encounterId }` | App command handler | Restores supplied starting plan |
| `battleStartRequested` | `{ encounterId, orderedUnitIds, teamPolicyId, techniquePolicyIds }` | Simulation boundary | Snapshot is explicit and replayable |
| `playbackChanged` | `{ mode: "play" | "pause", speed: 1 | 1.5 | 2 }` | Presentation only | Never changes facts or ordering |
| `skipToResultRequested` | `{ battleId }` | Presentation only | Applies supplied final presentation state and opens result; never cancels or changes simulation |
| `soundPreferenceChanged` | `{ muted: boolean }` | UI preference store | No direct audio call |
| `eventInspectorChanged` | `{ open, focusedEventId? }` | UI preference state | Closed by default for each battle |
| `rewardSelected` | `{ rewardId }` | App command handler | Selection only; no effect until confirm |
| `rewardConfirmed` | `{ rewardId }` | Domain command handler | Returns typed consequence state |
| `replayRequested` | `{ encounterId }` | App flow | Returns to preparation; does not reroll facts |
| `nextEncounterRequested` | `{ completedEncounterId }` | App flow | Opens the supplied next encounter |

## 10. State and error behavior

| State | Required behavior |
| --- | --- |
| Loading | Show named screen heading and stable skeleton blocks; no fake numbers or event text |
| Preparation valid | Start button enabled and plan summary visible |
| Preparation invalid | Start disabled; one concrete inline reason linked to the affected control |
| Command rejected | Keep prior visible state; focus and announce supplied reason |
| Replay ready | Playback begins only after battlefield assets and event facts are available |
| Playback paused | Keep current event and state visible; button label changes to **Resume** |
| Playback skipped | Stop pending animation, render supplied final unit state, then enter result; do not synthesize intermediate facts |
| Inspector open | Playback continues unless the player pauses; opening does not pause automatically |
| Result ready | Stop playback, freeze final state, focus result heading, announce win, loss, or draw once |
| Reward pending | Continue disabled; selected card has check icon, text **Selected**, and border change |
| Reward confirmed | Disable reward editing and expose replay/next action |
| Asset missing | Render a neutral silhouette selected deterministically from stable unit ID, with supplied name; facts and controls remain usable |
| Data validation failure | Show a plain recovery message and copyable error ID; do not invent fallback mechanics |

## 11. Playback and motion contract

The authoritative event array remains unchanged. Presentation partitions it once into setup, action, and outcome moments. Every raw event belongs to exactly one moment. An action moment contains one intent and its complete causal result, including target changes, stance use, damage or healing, resource changes, break, defeat, and decisive facts.

**Key moments** is the default. It includes setup and outcome, the first use of every selected stance that occurs, the first enemy rule or mark, policy interception, conditions, equipment, breaks, defeats, and the decisive moment. Repeated routine uses may be compressed. **Every action** is a reversible presentation control and still advances grouped action moments, never individual calculation events.

The current moment card uses one plain chain:

> actor + stance trigger or action -> intended/resolved target -> exact aggregate result

A persistent three-item Plan tracker gives Ada, Bo, and Cy equal space. Before a stance is used it says **Ready** only when linked action-option facts prove readiness; otherwise it says **Not used yet**. After use it shows the latest activation round, exact stance effect and cost, and the relevant aggregate result.

Every rendered action moment follows the same grammar:

> intent -> anticipation -> contact -> consequence -> recovery

At consequence, the number, bar update, status update, and reaction are presented together from typed events in the grouped action. Aggregate deltas retain gained, lost, net, before, after, and ordered source IDs so multi-hit, multi-heal, resource-spend, target-change, and line-break chains are exact without showing internal churn. Audio cues only the moment's typed focus event once. Animation is a view over already-produced authoritative facts. Simulation does not wait for a transition, animation callback, audio cue, paused player, background tab, or asset load.

### 11.1 Grouped action timing

- Routine grouped action: 800-1000 ms at 1x.
- Stance, enemy-rule, signature, break, defeat, and decisive moments: 2000-2800 ms at 1x.
- Playback speed divides presentation time only. It never changes events, grouping, focus, state, or result.
- Stable camera; no shake, zoom, flash, or full-screen overlay.
- Health changes are the largest local number and retain a visible `HP` label. Guard, points, strain, speed, and maximum-health changes stack below in sequence order rather than overlap.
- Marked persists until its action resolves; Broken and Defeated follow the supplied unit state; Bruised remains visible for the full battle when supplied by the command or condition event.
- The current card reports how many routine actions were advanced since the previous displayed moment.

### 11.2 Signature event

- Only events supplied with `emphasis: "signature"` receive signature treatment.
- Use up to 180 ms impact hold, one stronger pose or reaction, and one callout.
- Callout format: `[hero name]: [plain rule]`; maximum eight displayed words in English reference copy.
- Do not use camera shake. A camera scale change, if used, is capped at 1.03 and 240 ms total.
- Never obscure health, intent, or target labels.

### 11.3 Decisive event

- Only the single event supplied with `emphasis: "decisive"` receives the decisive treatment. If no event is supplied, none is invented.
- Slow presentation time to 0.65x for at most 900 ms around that event, then return to the chosen speed.
- Show the label **Turning point** and retain the event fact in the lower fact strip for at least 1.5 seconds.
- One low-amplitude camera scale or positional accent is allowed; no repeated shake and no screen flash.

### 11.4 Reduced motion

- Replace travel with a source highlight, then target highlight and result update.
- Replace camera scale/position changes with a 3 px outline increase and text label.
- Remove hit-stop, parallax, shake, particle drift, and repeated pulses.
- Keep the same cause, targets, aggregate values, Plan tracker, callouts, decisive label, and progress facts. Every displayed moment remains available for at least 1.5 seconds at 1x.
- The reduced-motion path must consume the same ordered events and end on the same final frame.

### 11.5 Skip to result

- **Skip to result** is available from the start of playback and has a 44 x 44 CSS px minimum target.
- On activation, cancel presentation timers and animation work, apply the supplied final battle state, then open the normal result screen.
- Do not fire skipped animation or audio callbacks as domain events.
- Do not omit the plan, turning point, consequence, reward, replay, or exact event inspector from the result.
- The inspector still contains the full typed event sequence.
- Focus moves to the result heading and the outcome is announced once.
- Skip is direct, not confirmed, because it is reversible through replay and cannot change the result.

## 12. Copy and localization contract

- All player-facing copy uses localization keys and parameters. No string concatenation for sentences.
- Use concrete verbs: **mark**, **guard**, **move**, **hit**, **heal**, **break**, **choose**, **replay**.
- Name the affected slot or unit. Prefer “Rear is marked every third action” over invented lore terms.
- Do not use grand titles, inflated adjectives, decorative lore compounds, or claims such as “ultimate,” “legendary,” “unstoppable,” or “world-shaking.”
- Buttons use verb-first labels: **Start battle**, **Move to front**, **Show exact event**, **Choose item**.
- Avoid directional-only copy such as “move left” when layout changes by locale or viewport. Use semantic positions: front, middle, rear.
- Allow 35% string growth. Do not bake English word order into icons, animation, or layout.
- Numbers use locale-aware formatting. Internal IDs and seed labels are not translated but must have translated labels.

## 13. Explicit content budgets

| Content | Budget |
| --- | --- |
| Encounter name | 28 Latin characters reference; 2 lines maximum |
| Enemy rule | 90 Latin characters reference; 2 desktop lines / 3 mobile lines |
| Reward category | 24 Latin characters reference |
| Hero/enemy display name | 22 Latin characters reference; 2 lines maximum |
| Role name | 18 Latin characters reference |
| Unit rule summary | 72 Latin characters reference; 2 lines |
| Policy name | 24 Latin characters reference |
| Policy effect | 100 Latin characters reference; 3 lines |
| Action name | 28 Latin characters reference; 1 desktop line / 2 mobile lines |
| Signature callout | 8 English reference words; one callout at a time |
| Current moment chain | Cause, target, and exact result; wraps without truncating mechanics |
| Statuses on battlefield | 3 per unit; extras shown as `+N` with accessible list |
| Result fact | 120 Latin characters reference; 3 lines each |
| Result facts | Exactly 3: plan, turning point, consequence |
| Reward options | 2 cards in the first pair |
| Reward effect | 100 Latin characters reference; exact values required |
| Validation/error message | 100 Latin characters reference; one action or recovery step |
| Simultaneous numeric changes | 3 visible per unit; additional changes queue in event order |

Content that exceeds a budget must wrap or move to the exact-details view. It must not be silently truncated if it changes mechanical meaning.

## 14. Acceptance criteria

### Flow

- A first-time player can read the enemy rule, change formation and policies, start battle, understand the result, select one item, and open the second encounter without a page reload.
- The full pair can be completed at 1x speed in 205-290 seconds with target event data.
- Replay uses the same encounter inputs unless the player changes the plan.

### Battlefield clarity

- Actor, target, action, and resulting numeric/status changes are visible for every counterable action.
- The avoidable threat is shown before impact.
- Ordinary actions use no camera movement or large overlay.
- Signature and decisive treatment occurs only for events carrying the matching typed emphasis.
- The decisive break or its prevention can be identified with the inspector closed.

### Input

- Every flow action works with keyboard only, mouse only, and touch only.
- Drag has a button and keyboard equivalent.
- Focus remains visible and moves predictably after reorder, result transition, sheet open/close, and validation failure.

### Accessibility

- UI works at 125% browser text zoom at both target viewports with no loss of mechanical content or action.
- State is never communicated by color alone.
- Reduced motion preserves event order, durations needed to read intent, exact deltas, stance ribbons, status text, and final state while removing rise, shake, and travel.
- Live announcements do not speak every animation frame; they announce intent, decisive event, result, and player-caused validation errors.
- Exact values and statuses are reachable with assistive technology.

### Architecture

- Presentation renders validated immutable facts and emits commands only.
- No UI component imports authoritative simulation mutation functions.
- Pause, speed, skip, inspector, mute, text size, and reduced motion do not alter replay event content, order, or result.
- All result explanation rows resolve to valid source event IDs.
- All player-facing copy is retrieved through localization keys.

## 15. Automated protection requested from implementation

- Component tests: formation reorder by click/touch-equivalent and keyboard; policy selection; focus retention; inspector focus/close; result/reward progression.
- Accessibility checks: visible labels, semantic headings, dialog/sheet focus trap, contrast tokens, no color-only state, reduced-motion styles.
- Responsive screenshots: `1365 x 768` and `390 x 844`, base text and 125% text.
- Playback tests: normal/signature/decisive event treatment; reduced-motion equivalent; pause/speed do not change final rendered fact sequence.
- Journey test: prepare -> battle -> result -> reward -> second encounter -> battle -> final result -> replay.

## 16. Simulation and content dependencies

The UI implementer needs the following before complete binding:

1. Stable schemas for all view models in section 9, validated at the application boundary.
2. Immutable ordered events with exact actor, targets, values, statuses, and resulting unit snapshots or a deterministic reducer owned outside UI.
3. A single typed decisive event reference, or an explicit absence. The UI must not choose one.
4. Typed signature trigger events and concise localized rule text.
5. Result facts for plan, turning point, and consequence, each linked to a valid event ID.
6. Starting plan, valid formation moves, team policy options, two validated stance options per hero, and concrete rejection reasons.
7. Reward options and confirmed consequences as typed facts.
8. Replay identity: seed, encounter ID, input command snapshot, and event sequence.
9. Audio event IDs/caption keys aligned to typed battle events; UI must emit or forward audio cues through the audio boundary.
10. Content fixtures for both encounter rules: rear marking and repeated-front break pressure.
