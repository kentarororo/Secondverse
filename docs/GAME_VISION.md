# ANOTHERVERSE REIMAGINED — Game Vision

## Product thesis

Anotherverse is an RNG character-development simulation expressed through dramatic 2D autobattles. The player discovers unpredictable myth-touched heroes, builds a three-person team, prepares formation, equipment, and technique policies, then watches readable automatic battles. Combat and character development are the product; concise authored text supports the simulation.

## Core fantasy

> I recognize hidden potential, build a clever team, accept meaningful risks, understand why battles change, and watch unknown fighters become my legends.

## Pillars

1. Every hero is a meaningful mechanical possibility.
2. Preparation visibly changes how battles unfold.
3. Combat produces persistent character stories.
4. Power growth is dramatic, numerical, and visible.
5. Randomness is surprising but understandable.
6. The battlefield—not a text log or dashboard—is the main spectacle.

## Anti-pillars

- No infinite or fragment-based prose generator.
- No large campaign before the three-minute gameplay loop is fun.
- No resource without an immediate decision or sink.
- No lore vocabulary used to disguise unclear mechanics.
- No long combat text scroll as the primary presentation.
- No superficial variation based only on names or adjectives.
- No quality claims unsupported by representative art, animation, audio, UX, and human evidence.
- No imitation of existing games, fiction, characters, terminology, plots, prose, or visual designs.
- No bombastic vocabulary. Names and copy must explain a concrete person, action, risk, or consequence in plain language.

## Battle presentation direction

Normal battle uses deliberate, readable staging: intent before impact, stable formation silhouettes, exact numbers at their source, and restrained camera movement. Signature rules and decisive moments may use faster motion, stronger reactions, and brief emphasis, but never at the cost of causality.

## Current product gate

Build a separate combat laboratory and remain there until five fresh play sessions satisfy the prototype criteria in the studio brief. Do not rebuild a campaign, procedural narrative, crafting, multiple currencies, or meta progression before that gate passes.

## Technical invariants

- Browser game: strict TypeScript, React, Vite, Zustand for app/UI state, Zod for runtime validation, Vitest, Playwright, CSS, and a `SaveRepository`-backed LocalStorage adapter.
- Authoritative generation and simulation are pure, framework-independent TypeScript.
- Named deterministic RNG streams reproduce roster, battle, reward, and consequence facts from the same seed and commands.
- Presentation renders typed facts and never invents outcomes.
- Production output remains compatible with GitHub Pages.

## Source of authority

The owner prompt and `ANOTHERVERSE_REIMAGINING_STUDIO_BRIEF.md` supplied on 2026-08-06 establish this reset. The hybrid combat direction was approved on 2026-08-06.
