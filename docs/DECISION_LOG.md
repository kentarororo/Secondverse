# Decision Log

## 2026-08-06 — Reimagination is the active product direction

- **Decision:** Treat the owner-supplied product vision, pillars, anti-pillars, technical foundation, and attached studio brief as the active direction for this repository.
- **Reason:** The owner explicitly commissioned ANOTHERVERSE REIMAGINED under those constraints.
- **Reversible:** Yes. No legacy files or commits exist in this repository.

## 2026-08-06 — Phase 0 is a clean reset

- **Decision:** Record no reusable or quarantined implementation because the local `Secondverse` repository is empty and `main` has no commits.
- **Reuse:** Product thesis and technical constraints only.
- **Quarantine:** The former campaign compiler and prose-heavy campaign direction conceptually; no code is present here.
- **One-sentence gate:** We reuse the deterministic-browser-game contract and rebuild the playable core; we do not continue the former campaign/prose product.

## 2026-08-06 — Implementation waits at the taste gate

- **Decision:** Do not create a feature branch or production code until the owner selects or revises the combat presentation target.
- **Reason:** Battle rhythm, information density, and spectacle materially define the game’s identity and are explicitly owner-owned in the studio brief.

## 2026-08-06 — Hybrid combat presentation approved

- **Decision:** Use Tactical Theatre clarity during ordinary action and Volatile Chorus motion only for signature triggers and decisive moments.
- **Owner wording:** “Hybrid, remember, learn from our mistakes, no bombastic vocabulary for this game.”
- **Language rule:** Use plain, concrete mechanical names and short human phrasing. Do not use grandiose lore compounds, inflated titles, or decorative vocabulary to make ordinary mechanics sound important.
- **Learning rule:** Failed hypotheses, confusing labels, dominant plans, and removed approaches stay in the decision and playtest logs so later work does not silently repeat them.
- **Reversible:** Timing and emphasis values are tuning data; the clarity-first hierarchy is product authority.

## 2026-08-06 — Stop content expansion at the first encounter-pair gate

- **Decision:** Do not add encounters three and four until the owner plays the complete first pair and the observation is recorded.
- **Reason:** The studio brief requires a playtest after every encounter pair, and automated correctness cannot establish enjoyment or desire to continue.
- **Evidence ready:** typecheck/build pass, Vitest 56/56, Playwright 19/19, normal playback 70.2 seconds.
- **Reversible:** If the human gate passes, the next pair can begin immediately with a new one-risk iteration packet.
