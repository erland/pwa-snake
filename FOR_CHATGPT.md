# FOR-CHATGPT.md

## Architecture (TL;DR)
- Framework public API is exported from **`src/framework/index.ts`** (the barrel). Treat this as the *stable contract*.
- Scenes derive from framework base classes. Cross-cutting config lives in `game.registry["services"]`.
- Input/UI/scale are utilities (DPadOverlay, BoardFitter). Fullscreen policy is read from `services.ui`.

## Stable Surface
- Imports should come from the barrel: `import { BasePlayScene } from "@/framework"`.
- The following hooks are stable across games:
  - `BaseBootScene`: `getBootTheme()`, `getBootSceneKeys()`, `getServiceOverrides()`, `preloadAssets()`
  - `BaseMenuScene`: `getTitle()`, `getStartHint()`, `afterCreate()`, `startGame()` (calls fullscreen based on services)
  - `BasePlayScene`: `createInput()`, `buildWorld()`, `tick(dtFixed)`, `frame(deltaMs)`
  - `BaseGameOverScene`: `getTitle()`, `getRetryHint()`, `getNextSceneKey()`, `afterCreate(data)`

## Services Contract
```ts
type Services = {
  theme: Theme;
  sceneKeys: { boot: string; menu: string; play: string; pause: string; gameOver: string };
  ui?: { autoFullscreen?: boolean };
};
// Access: const services = game.registry.get("services") as Services;
```

## Conventions When You Generate Code
- Put **pure** rules in `src/game/logic/**` and write unit tests.
- Use `BoardFitter` for transform; avoid custom scaling math.
- Use `DPadOverlay` for touch; keep interactions declarative.
- Use framework RNG (`RNG`, `MathRNG`, `randomInt`) rather than bespoke RNGs.
- Prefer hooks (`afterCreate`) over re-implementing `create()` in base scenes.

## Migration & Deprecation
- Only change public exports via the barrel. If you deprecate something, keep it exported for one minor release, mark with `@deprecated`, and add a note to `CHANGELOG.md`.
- When breaking a hook signature, add a short `docs/migrations/<version>.md` with a copy‑pasteable diff.

## Testing
- Game-agnostic tests should live under the framework.
- Per‑game tests exercise `src/game/logic/**` directly with `SeqRNG` for determinism.
- Keep `jest.config` mapping aligned with ESM and TS (ts-jest) as you have now.

## “How do I…”
- **Start a new game:** extend the base scenes, set `services` in boot, wire menu → play → gameOver flow.
- **Add on‑screen controls:** attach `DPadOverlay` in `buildWorld()` (only on coarse pointers if desired).
- **Tune time step:** set `hz` and `maxCatchUp` in `BasePlayScene` constructor.
- **Enter fullscreen on start:** set `services.ui.autoFullscreen = true` in your Boot `getServiceOverrides()`.
