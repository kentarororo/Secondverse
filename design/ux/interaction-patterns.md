# Interaction Pattern Library

**Status:** Initial combat laboratory baseline  
**Applies to:** First encounter pair and later screens unless revised with evidence

These patterns are new because the repository had no prior UX library. They use plain labels and keep game facts separate from presentation state.

## 1. Semantic formation reorder

**Use for:** Moving a hero among front, middle, and rear.

- Every hero card exposes its current semantic slot in visible text and accessible name.
- Pointer and touch: select the card, then use **Move to front**, **Move to middle**, or **Move to rear**. Drag may be added as a shortcut.
- Keyboard: `Tab` to the card, `Enter` or `Space` to select, then slot buttons; optional `Alt+Arrow` shortcut may move one slot if documented in the accessible hint.
- After a successful move, focus stays on the moved hero card in its new DOM position. Announce: `[name] moved to [slot].`
- On rejection, keep focus and announce the supplied reason. Do not silently snap back.
- Slot order in the DOM is front, middle, rear even when visual presentation mirrors the field.

## 2. Mechanical option selector

**Use for:** Team policy and per-hero technique policy.

- Use radio groups when exactly one option must be active.
- Each option contains a short name and a concrete effect. The full effect is visible; tooltips are supplementary only.
- Selection uses checked state, border/shape change, and the text **Selected**. Color may reinforce it.
- Unavailable options remain readable when useful and include a supplied reason.
- Changing an option emits an event. The UI does not calculate its effect.

## 3. Enemy rule banner

**Use for:** The encounter's counterable behavior.

- Place above preparation and battlefield content.
- Label **Enemy rule** followed by one concrete sentence.
- Maximum one primary rule in the first encounter pair.
- Never auto-collapse during preparation. During battle it may use a shorter supplied form, but remains visible.
- Do not encode timing only in an icon; show exact counts such as “every third action.”

## 4. Intent cue

**Use for:** A typed action before impact.

- Identify actor, target, and action name through text plus spatial/line treatment.
- Actor and target have different outline shapes and visible text labels.
- The cue remains stationary enough to read while figures move.
- It appears before counterable impact and stays for the supplied/readability timing.
- If one action has several targets, label **Targets** and mark each; do not cycle targets too quickly.

## 5. Source-bound value change

**Use for:** Damage, healing, guard, resource, and status change.

- Show the exact signed value at the affected unit, then update the persistent meter/text.
- Pair color with sign, icon/shape, and word or abbreviation.
- Queue more than three simultaneous changes per unit rather than overlap them.
- Assistive technology receives one concise event fact, not separate animation fragments.

## 6. Signature callout

**Use for:** A typed signature rule that changes an action.

- Format: `[hero name]: [plain rule]`.
- Eight English reference words maximum and one callout at a time.
- Use a bordered banner near the source unit, not a full-screen title.
- It may use one stronger pose and restrained timing emphasis.
- It cannot cover health, intent, target, or the current event fact.

## 7. Decisive event marker

**Use for:** The one typed turning-point event supplied by result analysis.

- Show **Turning point** before or with the decisive action.
- Retain the exact fact in the current-fact strip for at least 1.5 seconds.
- Apply emphasis once. Do not replay it as an automatic loop.
- If no decisive event is supplied, omit the pattern.
- Reduced motion uses an outline and label only.

## 8. Playback controls

**Use for:** Battle presentation only.

- Controls: pause/resume, speed `1x / 1.5x / 2x`, **Skip to result**, sound mute/unmute, exact events.
- Use text in the accessible name and tooltip; icon alone is insufficient.
- Pause keeps the current action and fact visible.
- Speed controls presentation time only and cannot modify event sequence.
- **Skip to result** cancels pending presentation work, renders the supplied final state, and opens the normal result. It does not cancel or alter authoritative simulation.
- Skip is not confirmed; replay makes it reversible. The exact inspector still contains every supplied event.
- Keyboard shortcuts, if added, must not fire while typing or conflict with browser defaults. Buttons remain the canonical path.
- Preferences for sound and reduced motion may persist; current playback position does not persist unless explicitly designed later.

## 9. Optional exact event inspector

**Use for:** Audit and deeper understanding, never required for the basic result.

- Closed by default at the start of each battle.
- Desktop: right side sheet, maximum 420 px. Mobile: bottom sheet, maximum 90% viewport height.
- Contains ordered event number, short fact, actor, targets, exact values, and stable event ID.
- Opening does not pause or restart battle.
- Selecting a linked result fact focuses its source event.
- On open, focus moves to the sheet heading. On close, focus returns to the opener.
- `Escape` closes on keyboard. A visible **Close exact events** button is always present.
- The event list may virtualize, but focused/current items must remain accessible and list position must be announced.

## 10. Three-fact result explanation

**Use for:** Battle result comprehension.

- Exactly three labeled rows: **Plan**, **Turning point**, **Consequence**.
- Every row renders a supplied fact and links to a valid exact event.
- The UI cannot rewrite, rank, or infer these facts.
- Keep the frozen final battlefield visible beside or above the rows.
- A row action is labeled **Show exact event**, not “Learn more.”

## 11. Equipment choice card

**Use for:** The one immediate reward decision.

- Show item name, affected stat/rule, exact value, and equipped target restrictions when supplied.
- First pair presents two options without a carousel.
- Selection is reversible until **Confirm choice**.
- Selected state uses a check icon, text, and border treatment.
- Do not label an option “best,” “recommended,” or by rarity unless supplied as an authored fact.

## 12. Validation and recovery message

**Use for:** Invalid preparation, rejected command, or invalid content.

- Put the message next to the affected control and summarize at the action area when start/continue is blocked.
- State the problem and one recovery step in concrete language.
- Move focus only when a submitted action fails; do not move focus while the player is still editing.
- Use `role="alert"` for player-caused blocking errors. Loading updates use polite status.
- Data validation failure exposes a copyable error ID and safe retry/reload action; it does not substitute invented values.

## 13. Sheet and dialog behavior

- Sheets are used for supplementary state without leaving the battle: unit details and exact events.
- Dialogs are reserved for destructive or irreversible choices. The first pair needs no dialog beyond an optional item-confirmation pattern if later playtests show misclicks.
- Trap focus only in modal surfaces. Nonmodal desktop side sheets remain in document order and have a clear close control.
- Do not open a sheet on hover alone.

## 14. Focus after transitions

| Transition | Focus target |
| --- | --- |
| Encounter load -> prepare | Screen heading, then enemy rule in reading order |
| Formation move | Moved hero card |
| Invalid start | First affected control or validation summary |
| Prepare -> battle | Battle heading; announce enemy rule once |
| Inspector open | Inspector heading |
| Inspector close | Button that opened it |
| Battle -> result | Result heading; announce outcome once |
| Reward confirm | Confirmation status, then replay/next actions in order |
| Next encounter | New encounter heading |

## 15. Pattern change rule

Implementation may not quietly alter these patterns. If a pattern fails in playtest, record the failed behavior and observed player problem, revise this file, and update relevant acceptance tests. Removed patterns remain in the decision/playtest record so they are not reintroduced without new evidence.

## 16. Animation grammar

**Use for:** Every battle action, including reduced motion.

1. **Intent:** name actor, target, and action.
2. **Anticipation:** readable preparation pose or static highlight.
3. **Contact:** one clear source-to-target connection.
4. **Consequence:** number, bar, status, and reaction update together from one typed event.
5. **Recovery:** figures return to a stable readable state unless a typed move changed formation.

Ordinary action uses the shortest complete form. Longer holds and stronger reactions are reserved for typed signature and decisive events. Authoritative simulation never waits for animation, audio, or UI callbacks.

## 17. Stable fallback silhouette

**Use for:** Missing, late, or failed combatant art.

- Choose a neutral silhouette variant deterministically from stable unit ID; never use random selection.
- Preserve side, slot, name, health, guard, resource, statuses, actor, and target labels.
- Silhouette shape plus visible side label distinguishes player and enemy; color is supplementary.
- Asset recovery may replace the silhouette without restarting playback or changing layout size.
