# Minimal Snake PWA — LLM Implementation Plan (TypeScript + Phaser + Vite + Jest)

**Purpose:** A precise, step‑by‑step plan for how I (as an LLM) would implement the bare‑minimum Snake game described in the spec.  
**Outputs:** A running PWA, unit‑tested core logic, and minimal rendering/input wiring.

---

## Phase 0 — Repo Scaffolding

**0.1 Create project**
```bash
npm create vite@latest snake-pwa -- --template vanilla-ts
cd snake-pwa
npm i
git init && git add -A && git commit -m "chore: scaffold Vite TS app"
```

**0.2 Install deps**
```bash
npm i phaser vite-plugin-pwa
npm i -D jest ts-jest @types/jest babel-jest @babel/preset-typescript
npm i -D typescript @types/node
```

**0.3 Configure Jest**
Create `jest.config.ts`:
```ts
import type { Config } from "jest";
const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  moduleFileExtensions: ["ts", "js"],
  transform: { "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.json" }] },
  collectCoverageFrom: ["src/game/**/*.ts"],
};
export default config;
```
Add script to `package.json`:
```json
{ "scripts": { "test": "jest", "test:watch": "jest --watch" } }
```
Commit.

**0.4 Configure PWA (Vite)**
Edit/add `vite.config.ts`:
```ts
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Snake",
        short_name: "Snake",
        start_url: ".",
        scope: "/",
        display: "standalone",
        background_color: "#000000",
        theme_color: "#000000",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
        ]
      }
    })
  ]
});
```
Create `public/manifest.webmanifest` (kept simple to mirror VitePWA manifest) and `public/icons/` with placeholder PNGs. Commit.

---

## Phase 1 — Pure Game Logic (Unit-Tested)

> All files under `src/game/`. No Phaser imports.

**1.1 Types & constants**
- `types.ts`: `Point`, `Direction`, `GridConfig`, `GameConfig`, `GameState`.
- `constants.ts`: default grid (`20x20`), `STEP_MS=150`, `START_LEN=3`, `START_DIR="right"`, `TILE_SIZE_PX=16`.

**1.2 Direction utilities**
- `direction.ts`:
  - `isOpposite(a: Direction, b: Direction): boolean`
  - `dirToVec(dir): Point` → up(0,-1), right(1,0), down(0,1), left(-1,0)

**1.3 RNG**
- `rng.ts`:
  - `Random` interface with `nextInt(maxExclusive): number`
  - default `MathRandom` implementation for production
  - deterministic stub for tests

**1.4 Rules**
- `rules.ts`:
  - `hitsWall(p, grid)`
  - `hitsSelf(p, snake)`
  - `placeFood(snake, grid, rng)` → random free cell, handle nearly full grid

**1.5 Step function**
- `step.ts`:
  - `nextHead(head, dir, grid)` (no wrap)
  - `advance(state, rng): GameState` implementing the tick rules incl. `pendingDir`

**1.6 Unit tests**
Create tests in `tests/`:
- `rules.test.ts`: wall/self collisions; food placement never on snake
- `step.test.ts`: movement, growth on food, stop on game over, no 180° reversals, pendingDir applies at tick

Run:
```bash
npm run test
```
Commit when green with >=80% coverage for `src/game` (Jest prints coverage).

---

## Phase 2 — Phaser Wiring (Rendering & Input)

**2.1 Bootstrap**
- `src/main.ts`: create Phaser.Game with pixelArt, width/height = `GRID * TILE_SIZE_PX`, scene = `GameScene`.
- Minimal `index.html` uses `main.ts` entry.

**2.2 GameScene**
- `src/phaser/GameScene.ts`:
  - `create()`:
    - initialize pure `GameState` with defaults
    - graphics = `this.add.graphics()`
    - score text top-left; hidden game-over text center
    - set up timed event: `this.time.addEvent({ delay: STEP_MS, loop: true, callback: onTick })`
    - set up keyboard: Arrow + WASD; `R` for restart
  - `onTick()`:
    - call `advance(state, rng)`
    - if `isGameOver` -> show game-over text; stop updating visuals but still allow `R`
    - else redraw
  - `draw()`:
    - `graphics.clear()`; fill background; draw snake segments and food as rectangles using `fillRect`
  - Input:
    - on keydown, set `state.pendingDir` if not opposite
    - on `R` when game over: re-init `GameState`; hide game-over text

Commit.

**2.3 Verify manually**
- Start dev server: `npm run dev`
- Checks:
  - moves exactly 1 cell per tick
  - 180° reversals are rejected
  - eating food grows by 1 and increments score
  - wall/self collision → game over text appears
  - `R` restarts cleanly

Commit.

---

## Phase 3 — PWA Enablement

**3.1 Manifest & icons**
- Ensure `public/manifest.webmanifest` present; icons 192/512 exist.

**3.2 Service worker**
- VitePWA plugin already configured; build to generate SW.

**3.3 Registration (optional)**
- `src/pwa.ts` (optional): call `navigator.serviceWorker.ready` logs.
- Import once in `main.ts` if created.

**3.4 Offline check**
```bash
npm run build
npm run preview
```
- Open in browser → DevTools → Network → Offline → app still loads & runs after first successful online visit.

Commit.

---

## Phase 4 — Quality Gates

**4.1 Linting (optional for v1)**
- Could add ESLint + Prettier. Skipped if strictly minimal.

**4.2 Lighthouse**
- Check PWA installability (manifest + SW + HTTPS when deployed).

**4.3 Minimal CI (optional)**
- GitHub Actions workflow to run `npm ci && npm run test && npm run build`.

---

## Phase 5 — Deliverables Checklist

- [ ] `src/game/` pure logic implemented & unit-tested (>=80% coverage)
- [ ] `src/phaser/GameScene.ts` renders snake/food and handles input
- [ ] Timed tick (150 ms) uses pure `advance()`
- [ ] `R` to restart after game over
- [ ] Manifest + icons + VitePWA SW
- [ ] Builds & previews; offline after first load
- [ ] README with `npm run dev | build | preview | test`

---

## Prompts I Would Use (You can paste these to me step-by-step)

**P1 – Create pure logic skeletons**  
“Generate `src/game/types.ts`, `constants.ts`, `direction.ts`, `rng.ts`, `rules.ts`, and `step.ts` per the spec. No Phaser imports. Include named exports only.”

**P2 – Write Jest tests**  
“Generate Jest tests in `tests/rules.test.ts` and `tests/step.test.ts` covering collisions, food placement, move/grow/stop logic, pendingDir application, and reversal protection.”

**P3 – Phaser bootstrap & scene**  
“Create `src/main.ts` and `src/phaser/GameScene.ts` that render rectangles for snake and food, run a 150 ms timed event calling `advance()`, read keyboard (Arrow/WASD), show score and ‘Game Over — Press R to restart’.”

**P4 – PWA config**  
“Add `vite.config.ts` with `vite-plugin-pwa`, a minimal `public/manifest.webmanifest`, and example icon placeholders (192/512). Show how to verify offline in `npm run preview`.”

**P5 – Final verification**  
“List manual test steps matching acceptance criteria and any fixes needed if behavior differs.”

---

## File Map (final expected)
```
public/
  manifest.webmanifest
  icons/icon-192.png
  icons/icon-512.png
src/
  game/
    types.ts
    constants.ts
    direction.ts
    rng.ts
    rules.ts
    step.ts
  phaser/
    GameScene.ts
  main.ts
  pwa.ts          # optional
tests/
  rules.test.ts
  step.test.ts
index.html
vite.config.ts
jest.config.ts
package.json
tsconfig.json
```

---

## Acceptance Criteria Recap
- Tick-based movement 150 ms; no 180° reversal.
- Food spawns only on free cells; eating grows snake by 1 and increments score.
- Wall/self collision ends game and shows restart prompt; `R` restarts.
- PWA installable and works offline after first load.
- Unit tests for `src/game` >= 80% coverage.
