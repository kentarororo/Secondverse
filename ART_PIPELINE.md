# Anotherverse Art Pipeline

## Current state

The combat lab currently has no raster combat art. `src/ui/assets/combatAssetManifest.ts` contains validated placeholder records whose `source` is `null`. `CombatVisual` therefore renders the existing CSS silhouettes without making image requests.

Art is presentation data. Missing or failed art must not change a command, event, battle result, save, timing authority, target, or number.

## Stable IDs

Assets resolve from mechanical IDs, never display names:

- Units: `unit.ada`, `unit.bo`, `unit.cy`, and `enemy.<enemy_id>`
- Actions: `action.<action_id>`
- Statuses: `status.marked`, `status.broken`, `status.defeated`, `status.bruised`
- Effects: `effect.damage`, `effect.heal`, `effect.guard`, `effect.technique`, `effect.strain`, `effect.speed`

Generated heroes must later provide a stable `visualProfileId`. Do not derive an asset path from a generated name.

## Required manifest facts

Before an image can replace a fallback, record and validate:

- source path and `png` or `webp` format;
- full source width and height;
- frame width and height;
- row and column count;
- outer margin and spacing between frames;
- animation state frame lists, frame rate, loop setting, and contact frame;
- normalized feet, impact, and label anchors;
- facing and display scale;
- stable fallback ID;
- creator, source, and license.

Placeholder unit geometry is 96 by 128 CSS reference units. Action, status, and effect hooks use a 48 by 48 reference box. These are layout boxes, not claims about future source-image dimensions.

## Measurement and import

1. Open the source at native size.
2. Measure the full image.
3. Count rows and columns.
4. Measure margins and spacing.
5. Check that the recorded dimensions reproduce the full sheet exactly.
6. Render numbered raw frames in an isolated harness.
7. Mark idle, intent, action, hit, heal, and defeated frames as applicable.
8. Mark the exact contact frame and anchors.
9. Add attribution and license facts.
10. Set the manifest source only after validation passes.

Do not guess frame sizes or reuse measurements from a different sheet.

## Fallback order

1. Exact stable-ID asset.
2. Role or enemy-archetype asset named by `fallbackId`.
3. Existing CSS silhouette in the same fixed geometry.

A loading error follows the same fallback order. It does not restart playback. It should produce a development warning, not a player-facing broken image.

## Animation boundary

The event stream remains authoritative. Presentation follows:

1. Intent
2. Anticipation
3. Contact
4. Exact number and status consequence
5. Recovery

Reduced motion removes travel, rise, shake, flashes, particles, and repeated pulses while preserving actor, target, stance, action, exact numbers, status text, and final state. Skip reaches the same supplied result without waiting for animation callbacks.

## AI-assisted asset work

AI tools may help create original drafts after a written asset specification exists. For each draft:

1. Use an original brief based on Anotherverse mechanics and art direction.
2. Do not request, trace, reproduce, or closely imitate another game's characters, sprites, interface, effects, fonts, palettes, or layouts.
3. Keep the prompt, source files, edits, and generation record with the asset review.
4. Check silhouette clarity, frame continuity, palette, transparency, and anchors by hand.
5. Reject outputs with copied marks, recognizable character designs, broken anatomy, frame bleeding, or unclear ownership.
6. Measure and validate the accepted file through the same manifest process as hand-made art.

AI output is a draft source, not a validated game asset.

## Acceptance checks

- Removing every raster source still leaves all units, controls, labels, numbers, and statuses readable.
- Exact and fallback visuals occupy the same layout box at desktop, 125% text scale, and 390 by 844 mobile.
- No missing source creates a network error or broken-image icon in the placeholder build.
- Actor, target, action, stance, damage, healing, and statuses remain identifiable with the exact-event inspector closed.
- Bars and displayed numbers match the authoritative event and unit facts.
- Standard and reduced-motion playback end with identical result data.
