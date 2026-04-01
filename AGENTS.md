# Agents

## Purpose
This file is the shared handoff surface for future coding agents working in this repository.

## Project
- Name: `Gundam`
- Current focus: browser-based `Nu Gundam` combat sandbox in [prototype](/D:/Claude/Gundam/prototype)
- Goal: prove the core loop of programming a mobile suit combat OS, then observing and tuning live battles

## Current State
- The active prototype is a static browser app served from [prototype/index.html](/D:/Claude/Gundam/prototype/index.html)
- Combat now uses:
  - live simulation instead of replay-first playback
  - projectile beam fire
  - weave-style evasive boosts
  - shield interception and flux
  - visible funnels and beam trails
- Automated checks live under [prototype/test](/D:/Claude/Gundam/prototype/test)
- Current design direction is shifting away from `Interrupts + Doctrine` toward `Suit Core + Equipment Rack + Combat Chain`
- The current structure spec lives in [Documentation/CARD_STACK_CHAIN_SYSTEM_V1.md](/D:/Claude/Gundam/Documentation/CARD_STACK_CHAIN_SYSTEM_V1.md)

## Runbook
- Start local server:
  - `cd D:\Claude\Gundam\prototype`
  - `npm run serve`
- Open:
  - `http://localhost:4173`
- Run tests:
  - `npm test`

## Handoff Priorities
1. Preserve the `Char's Counterattack` / `Nu Gundam` duel feel.
2. Prefer tuning and readability over adding new systems.
3. Keep the rule editor surface simple unless the core loop clearly demands expansion.
4. Maintain deterministic simulation behavior.

## Main Files
- Prototype shell: [prototype/index.html](/D:/Claude/Gundam/prototype/index.html)
- Styles: [prototype/styles.css](/D:/Claude/Gundam/prototype/styles.css)
- Sim engine: [prototype/src/sim/engine.js](/D:/Claude/Gundam/prototype/src/sim/engine.js)
- Movement: [prototype/src/sim/movement.js](/D:/Claude/Gundam/prototype/src/sim/movement.js)
- Weapons: [prototype/src/sim/weapons.js](/D:/Claude/Gundam/prototype/src/sim/weapons.js)
- Defense: [prototype/src/sim/defense.js](/D:/Claude/Gundam/prototype/src/sim/defense.js)
- Renderer: [prototype/src/render/battle-renderer.js](/D:/Claude/Gundam/prototype/src/render/battle-renderer.js)
- Existing design brief: [Documentation/MECHA_AUTOBATTLER_HANDOFF_V2.md](/D:/Claude/Gundam/Documentation/MECHA_AUTOBATTLER_HANDOFF_V2.md)

## Next Handoff Notes
- Add concise architecture notes here when systems shift materially.
- Add tuning decisions here when they affect the intended combat feel.
- If implementing the UI redesign, treat the new card-stack-chain spec as the source of truth rather than extending the old rule editor.
