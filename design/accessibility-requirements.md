# Accessibility Requirements

**Committed prototype tier:** Enhanced baseline  
**Platforms:** Desktop browser and mobile browser  
**Input:** Keyboard/mouse and touch  
**Primary test viewports:** `1365 x 768` and `390 x 844`

This is a product requirement, not a claim of formal certification. Automated checks protect common failures; keyboard, screen-reader, zoom, reduced-motion, and touch behavior also require manual review.

## 1. Non-negotiable requirements

### Perception

- Text and meaningful icons meet at least 4.5:1 contrast against their background; large text and essential graphical boundaries meet at least 3:1.
- Focus indicators meet at least 3:1 against adjacent colors and are at least 2 CSS px thick or an equivalent area.
- Color is never the only signal for team, target, actor, selection, health state, status, gain, loss, signature, or turning point. Pair it with labels, shape, icon, pattern, or position.
- Combat health and guard expose exact numbers in addition to meters.
- Statuses have text names. Icons are supplementary.
- Audio that carries tactical information has an equivalent visual event fact or caption. The game remains understandable when muted.
- Do not use rapid full-screen flashes. No content may flash more than three times in one second.

### Text and zoom

- Support browser text zoom at 125% at both target viewports without clipped mechanical copy, covered controls, loss of action, or horizontal page scrolling.
- Base body text is at least 16 CSS px. Battlefield unit facts may use 14 CSS px only when the exact same values are available in the reachable unit detail sheet.
- Line height is at least 1.4 for body/mechanical text and 1.2 for headings.
- Player-facing copy wraps. Mechanical meaning is never hidden only behind ellipsis or hover.
- Layout allows at least 35% localization expansion and two-line names where specified.

### Motion

- Respect `prefers-reduced-motion: reduce` on first load and provide an in-game reduced-motion control.
- Reduced motion removes travel animation, camera movement, parallax, hit-stop, shake, drifting particles, and repeated pulses.
- Reduced motion preserves actor, target, action order, intent time, numeric/status change, signature text, turning-point text, and final state.
- No information is available only while an object is moving.
- Decorative animation can be paused or removed without affecting simulation.

### Input and focus

- Every required action is operable by keyboard only, mouse only, and touch only.
- Drag-and-drop is optional and always has semantic move buttons.
- Touch targets are at least 44 x 44 CSS px with at least 8 px separation where accidental activation would be costly.
- Keyboard focus order follows the visual/task order. No positive `tabindex` values.
- Focus is always visible and is not obscured by sticky controls, sheets, or safe-area insets.
- `Escape` closes the top dismissible sheet. A visible close button is also required.
- Focus returns to the opener after a sheet closes.
- Disabled actions expose a nearby visible reason; do not rely on disabled-button hover text.

### Semantics and assistive technology

- One `h1` names the current screen; section headings follow a logical order.
- Use native buttons, radio groups, progress elements, lists, and dialogs/sheets where their semantics fit.
- Every icon-only control has an accessible name that states action and current state, for example **Pause battle** or **Unmute sound**.
- Unit cards expose name, side, slot, current/max health, guard, resource, and statuses in a concise accessible description.
- Intent announcements include actor, action, and target.
- Use a polite live region for new intent and a separate assertive announcement only for blocking player errors. Do not announce every animation frame or meter interpolation.
- Battle result is announced once when the result heading receives focus.
- The exact event inspector exposes a navigable ordered list and the current/focused event.

## 2. Combat-specific rules

- Actor and target use distinct outline shapes and visible labels **Acting** and **Target**; team side is also spoken and labeled.
- Enemy rules remain text-visible during preparation and battle.
- Intent is displayed before counterable impact for at least the specified readable duration.
- Floating values are duplicated in persistent meters/text and in the exact event fact.
- A maximum of three statuses appears on the battlefield; an accessible `+N` control exposes the full list.
- A signature callout includes hero name and plain rule text.
- The decisive event includes **Turning point** text. Extra motion or sound is supplementary.
- Pause leaves current facts on screen. Speed changes do not shorten semantic live-region text; announcements queue or summarize rather than overlap.
- **Skip to result** is keyboard, mouse, and touch operable, moves focus to the result heading, and preserves access to all exact events and result facts.

## 3. Preparation-specific rules

- Formation slots are named front, middle, and rear in visible and accessible text.
- Reordering by keyboard and touch does not depend on spatial direction words.
- After reorder, focus stays with the hero and a polite announcement confirms the new slot.
- Policy selectors use radio-group semantics and show concrete effects without requiring hover.
- The current complete plan is summarized before **Start battle**.
- If preparation is invalid, the error points to the affected control and gives one recovery action.

## 4. Result and reward rules

- Result has one explicit **Win**, **Loss**, or **Draw** heading supplied by the result fact.
- Plan, turning point, and consequence are headings/labels linked to exact source events.
- Item choices expose names, exact effects, restrictions, and selection state.
- Selected reward state uses text **Selected**, a check icon, and border treatment.
- Focus moves to the result heading on transition; it does not jump to the next-action button.
- Item confirmation status is announced once.

## 5. Preference behavior

| Preference | Default | Persistence | Simulation effect |
| --- | --- | --- | --- |
| Reduced motion | System setting | Local UI preference may override and persist | None |
| Sound mute | Unmuted unless browser policy prevents playback | Persist locally | None |
| Playback speed | `1x` | Current session only for prototype | None |
| Text scale | Browser/user setting | Browser-owned | None |
| Exact event inspector | Closed | Do not persist open state | None |

Preference storage is UI state only. It must not enter authoritative command snapshots or change replay identity.

## 6. Plain-language and cognitive load

- Use familiar concrete words and verb-first actions.
- One enemy rule is primary per first-pair encounter.
- One signature callout is visible at a time.
- Result explanation is limited to three supplied facts.
- The exact event inspector is closed by default.
- Avoid decorative vocabulary, invented synonyms for common mechanics, all-caps paragraphs, and unexplained abbreviations.
- Instructions state the action and consequence. Example: **Move a hero to the rear to take marked attacks.**

## 7. Manual acceptance checks

### Keyboard-only

1. Complete preparation, including at least one formation move and each policy type.
2. Start battle, pause/resume, change speed, mute sound, open/close exact events, and use skip to result on one replay.
3. Inspect a linked result event, select/confirm a reward, open encounter two, and replay.
4. Confirm visible focus and expected focus return at every step.

### Touch-only at `390 x 844`

1. Complete the same path without drag gestures.
2. Confirm every core target is at least 44 x 44 CSS px and sticky controls do not cover content.
3. Confirm sheets can be closed and content has no horizontal scroll.

### Text at 125%

1. Repeat prepare, battle, inspector, result, and reward screens at both target viewports.
2. Confirm mechanical rules and exact values do not clip or disappear.
3. Confirm focus is not hidden and no core action requires horizontal page scrolling.

### Reduced motion

1. Enable at OS/browser level before load, then test the in-game override.
2. Confirm no camera motion, travel, shake, hit-stop, parallax, repeated pulse, or drifting particle remains.
3. Compare ordered event IDs and final state with standard motion; they must match exactly.

### Screen reader

1. Verify heading order and encounter rule discovery.
2. Reorder formation and confirm slot announcement.
3. Follow intent without duplicate or overlapping speech.
4. Inspect exact unit values, statuses, current event, and result source events.
5. Confirm result and reward selection announcements occur once.

### Color independence

1. Test in grayscale and with color-vision simulation.
2. Identify side, actor, target, selected policy, selected item, gain, loss, status, signature, and turning point without naming colors.

## 8. Automated checks

- Run an accessibility scanner on prepare, battle paused, inspector open, result, and reward-selected states.
- Assert no unlabeled interactive controls and no duplicate IDs.
- Assert every button and touch target meets minimum dimensions at both target viewports.
- Assert DOM focus order and focus restoration for reorder and sheets.
- Assert reduced-motion media query and preference class disable prohibited motion properties.
- Capture responsive screenshots at base and 125% text for both target viewports.
- Test that changing UI preferences leaves ordered event IDs and final result unchanged.

## 9. Known review boundary

The prototype baseline must be reviewed manually with at least keyboard-only and one screen-reader path before claiming accessibility acceptance. Broader assistive-technology coverage and user testing with disabled players remain required before a release-level claim.
