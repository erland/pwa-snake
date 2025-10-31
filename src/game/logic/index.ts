// Re-export constants
export { TILE_SIZE, GRID, TICK_MS } from "./constants";

// Re-export types (type-only)
export type { Point, Direction, GameState, GridConfig, GameConfig } from "./types";

// Re-export helpers and core logic
export { isOpposite, dirToVec } from "./direction";
export { advance } from "./step";
export { placeFood, hitsWall, hitsSelf } from "./rules";

// Re-export RNGs so scenes can match original behavior
export { MathRandom, SeqRandom } from "./rng";

// Initial state factory (does NOT call placeFood)
import type { GameState, Point, Direction } from "./types";
import { GRID } from "./constants";

export function createInitialState(): GameState {
  const grid = GRID; // { cols, rows }
  const mid: Point = {
    x: Math.floor(grid.cols / 2),
    y: Math.floor(grid.rows / 2),
  };

  const startDir: Direction = "right";
  const snake: Point[] = [
    mid,
    { x: mid.x - 1, y: mid.y },
    { x: mid.x - 2, y: mid.y },
  ];

  // Deterministic first-free cell; scene may overwrite with RNG placeFood
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
  let food: Point = { x: 0, y: 0 };
  outer: for (let y = 0; y < grid.rows; y++) {
    for (let x = 0; x < grid.cols; x++) {
      if (!occupied.has(`${x},${y}`)) { food = { x, y }; break outer; }
    }
  }

  return {
    grid,
    dir: startDir,
    pendingDir: null,
    snake,
    food,
    score: 0,
    isGameOver: false,
  };
}