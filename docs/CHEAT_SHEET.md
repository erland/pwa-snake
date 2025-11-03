# Framework Cheat Sheet

This page is the minimal, high-signal reference for using the framework in 2D games.

## Boot

- Extend `BaseBootScene` in your game and override:
  - `getBootTheme()` → return your theme object.
  - `getServiceOverrides()` → e.g. `{ ui: { autoFullscreen: true } }`.
  - (optional) `getBootSceneKeys()` if you need custom scene key names.
- `BaseBootScene.create()` guarantees `game.registry["services"]` exists, configures scale, then `start(sceneKeys.menu)`.

## Menu

- Extend `BaseMenuScene`.
- Optional overrides:
  - `getTitle()` → defaults to `services.theme.title`
  - `getStartHint()` → quick localization
  - `afterCreate()` → add extra widgets (e.g., high score)
- Fullscreen is automatic if `services.ui.autoFullscreen === true` (set in Boot).

## Play (fixed-step)

- Extend `BasePlayScene`:
  - `constructor({ hz, maxCatchUp })` to control simulation rate and catch-up.
  - `createInput()` → return your input controller.
  - `buildWorld()` → assemble containers, attach helpers.
  - `tick(dtFixed)` → advance **pure** game logic (no rendering).
  - `frame(deltaMs)` → render, HUD, VFX.
- Helpers you’ll usually want:
  - `new BoardFitter(this, boardRoot, () => ({ w, h }), { fitMode: "fit" }).attach()`
  - `new DPadOverlay(this).attach()` for touch devices

## Pause / Game Over

- `BasePauseOverlay` → a simple overlay you can style.
- `BaseGameOverScene` hooks:
  - `getTitle()`, `getRetryHint()`, `getNextSceneKey()`
  - `afterCreate(data)` → add score/high-score etc.

## Services (registry)

- Access with `const services = game.registry.get("services")`.
- Shape (stable):
  ```ts
  interface GameServices {
    theme: Theme;
    sceneKeys: { boot: string; menu: string; play: string; pause: string; gameOver: string };
    ui?: { autoFullscreen?: boolean /* add more flags as needed */ };
  }
  ```
- Prefer reading flags from `services` rather than hardcoding.

## RNG

- Use framework RNG everywhere:
  - Types: `RNG`
  - Implementations: `MathRNG`, `LCG`, `SeqRNG`
  - Helper: `randomInt(rng, maxExclusive)`

## Conventions

- Keep gameplay rules **pure** (`src/game/logic/**`) → unit-test those.
- Use `BoardFitter` for scale/center instead of manual math.
- Use `DPadOverlay` for touch; avoid bespoke input buttons unless necessary.
- Avoid DOM queries; read safe-area CSS vars if needed (overlay already does).
- Favor small hook methods (`afterCreate`, `buildBackground`) over overriding `create()` in base scenes.

## Typical Scene Order

1. `BaseBootScene` → sets services, scale → `start(menu)`  
2. `BaseMenuScene` → waits for user gesture, (optionally fullscreen) → `start(play)`  
3. `BasePlayScene` → game loop (`tick`/`frame`) → `start(gameOver | pause)`  
4. `BaseGameOverScene` → retry → `start(menu | play)`

