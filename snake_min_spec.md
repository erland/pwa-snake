# Minimal Snake PWA – Technical Specification (TypeScript + Phaser + Vite)

**Version:** 1.0  
**Date:** 2025-10-30  
**Target:** Desktop web (installable PWA). Mobile support can come later.  
**Scope:** Absolutely minimal, no bells or whistles.

---

## 1) Overview
Build a bare-bones Snake game as an installable Progressive Web App (PWA) using **TypeScript**, **Phaser 3**, and **Vite**. The game uses a grid, renders simple rectangles (no image assets), and features basic scoring and restart.

---

## 2) Goals (Must-have)
- Deterministic grid-based movement.
- Basic rules: eat food → grow by 1; collision with wall or self → game over.
- Keyboard controls (Arrow keys and WASD). One direction change per tick; disallow 180° reversals.
- Single scene gameplay with a minimal text UI (score + game-over prompt).
- Installable PWA that works offline after first load (manifest + service worker).
- Unit tests (Jest) for pure game logic (no Phaser rendering).

---

## 3) Non-Goals (Out of scope for v1)
- Touch controls, sound, animations, skins, menus, leaderboards.
- Multiple scenes, pausing, difficulty/speed levels, high scores, settings.
- Save/restore game state between sessions.

---

## 4) Core Gameplay
**Grid:** 20 × 20 (configurable).  
**Tile size:** 16 px (configurable).  
**Game step:** every 150 ms (configurable, independent of frame rate).  
**Snake start:** length 3; start direction: right; start position: centered row.  
**Food:** spawns at a random free cell (never on the snake).  
**Score:** `length - startingLength`.  
**Win/Lose:** No explicit win; lose on hitting walls or self.  
**Restart:** Press `R` after game over.

---

## 5) Controls
- **Arrow keys** or **W/A/S/D** to change direction.
- Direction change processed at the next tick.
- Reject a change that is the exact opposite of current direction.

---

## 6) Visuals (Minimal)
- Background: solid color.
- Snake: filled rectangles (head could be same color as body for v1).
- Food: filled rectangle (different color).
- UI text (top-left): “Score: <n>”.
- Game Over text (center): “Game Over — Press R to restart”.

---

## 7) Tech Stack
- **Language:** TypeScript
- **Engine:** Phaser 3
- **Bundler/Dev server:** Vite
- **Testing:** Jest + ts-jest / babel-jest for TS
- **PWA:** Web App Manifest + Service Worker (use `vite-plugin-pwa` for minimal setup)

---

## 8) Project Structure
```
/snake-pwa/
  ├─ public/
  │   ├─ manifest.webmanifest
  │   └─ icons/            # placeholder icons (192, 512)
  ├─ src/
  │   ├─ game/             # pure logic (unit-testable)
  │   │   ├─ types.ts
  │   │   ├─ constants.ts
  │   │   ├─ direction.ts
  │   │   ├─ rng.ts
  │   │   ├─ rules.ts      # collision, growth, spawn food
  │   │   └─ step.ts       # advance one tick (state → state)
  │   ├─ phaser/
  │   │   └─ GameScene.ts  # minimal rendering + input wiring
  │   ├─ main.ts           # Phaser game config bootstrap
  │   └─ pwa.ts            # optional registration hooks if needed
  ├─ tests/
  │   ├─ rules.test.ts
  │   └─ step.test.ts
  ├─ index.html
  ├─ vite.config.ts
  ├─ package.json
  └─ tsconfig.json
```

---

## 9) Data Model (Pure Logic)
```ts
// types.ts (pure types)
export type Point = { x: number; y: number };

export type Direction = "up" | "down" | "left" | "right";

export interface GridConfig {
  cols: number; // 20
  rows: number; // 20
}

export interface GameConfig {
  stepMs: number; // 150
  startLen: number; // 3
  startDir: Direction; // "right"
}

export interface GameState {
  grid: GridConfig;
  dir: Direction;
  pendingDir: Direction | null;  // set on key press, applied at tick if valid
  snake: Point[];                // [head, ...body] head at index 0
  food: Point;
  score: number;
  isGameOver: boolean;
}
```

---

## 10) Core Logic (Pure, Testable)
- **`isOpposite(a, b): boolean`** – prevents 180° turns.
- **`nextHead(head, dir, grid): Point`** – wraps? **No** (v1: wall is fatal).
- **`hitsWall(p, grid): boolean`**
- **`hitsSelf(p, snake): boolean`**
- **`placeFood(snake, grid, rng): Point`** – random free cell.
- **`advance(state, rng): GameState`** (single tick):
  1. Apply `pendingDir` if present and not opposite.
  2. Compute next head by moving 1 cell in `dir`.
  3. If wall or self → `isGameOver = true` (state frozen).
  4. Else unshift new head.
  5. If head equals `food` → increment `score`, keep tail (grow), respawn `food`.
  6. Else pop tail (move).

_All of the above live under `src/game/*.ts` and have no Phaser imports._

---

## 11) Rendering & Input (Phaser)
- **Scene:** `GameScene` handles:
  - Creating a timed event (150 ms) to call `advance()` and re-draw.
  - Drawing rectangles for snake segments and food using Graphics.
  - Handling keyboard input (Arrow/WASD) to set `pendingDir`.
  - Displaying score and game-over text.
  - On `R` when `isGameOver`, reinitialize state.

---

## 12) Game Loop & Timers
- Use a Phaser **timed event** (`scene.time.addEvent`) with `loop: true` and `delay = stepMs`.
- Rendering occurs after each successful `advance()`.
- Avoid frame-based movement to keep speed consistent across devices.

---

## 13) PWA Requirements
- **Manifest (`public/manifest.webmanifest`):**
  - `name`, `short_name`, `start_url: "."`, `scope: "/"`, `display: "standalone"`
  - `background_color` / `theme_color`: e.g., `#000000`
  - Icons at least 192×192 and 512×512
- **Service Worker:**
  - Use `vite-plugin-pwa` (GenerateSW) to precache `index.html`, JS bundles, and manifest.
  - App is fully playable offline **after first load**.
- **Installability:**
  - Passes Lighthouse PWA install criteria (manifest + SW + served over HTTPS).

---

## 14) Testing (Jest)
- **Scope:** unit tests for `src/game/*` only.
- **No DOM/Phaser** in unit tests.
- **Cases:**
  - `isOpposite` correctness.
  - Movement from head with each direction.
  - Wall collision detection on borders.
  - Self-collision when head moves into body.
  - Food placement never on snake; covers nearly-full grid.
  - `advance` behavior: move, grow on food, stop on game over.
- **Target:** ≥ 80% coverage on `src/game`.

---

## 15) Scripts
- `dev`: Vite dev server.
- `build`: Vite build.
- `preview`: Vite preview (serves `dist/`).
- `test`: Jest in watch/CI mode.

---

## 16) Acceptance Criteria
1. Snake moves one cell per 150 ms consistently across machines.
2. Direction changes only apply at ticks and never allow a 180° reversal.
3. Food spawns only on free cells; eating grows the snake by 1 and increments score.
4. Hitting wall or self immediately ends the game and shows “Game Over — Press R to restart”.
5. Pressing `R` after game over resets to the initial state.
6. The app installs as a PWA and works offline after first load.
7. Unit tests pass with ≥ 80% coverage for `src/game`.

---

## 17) Initial Config Values (can be constants in `constants.ts`)
```ts
export const GRID: GridConfig = { cols: 20, rows: 20 };
export const STEP_MS = 150;
export const START_LEN = 3;
export const START_DIR: Direction = "right";
export const TILE_SIZE_PX = 16;
```

---

## 18) Assumptions & Risks
- Fixed grid and viewport; no scaling for various screen sizes in v1.
- Keyboard-only controls; limited playability on mobile until touch controls are added.
- No persistence; reload loses state (acceptable for v1).

---

## 19) Milestones
1. **Day 1:** Project scaffolding (Vite + TS + Phaser), manifest + PWA plugin, empty scene.
2. **Day 2:** Pure logic (`src/game/*`) + unit tests passing.
3. **Day 3:** Hook logic to Phaser rendering; keyboard input; score text.
4. **Day 4:** Game over + restart; offline verified; polish minimal text & colors.
