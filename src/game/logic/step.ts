// src/game/logic/step.ts
import type { Direction, GameState } from "./types";
import type { RNG } from "../../framework/core/rng";
import { resolveDirection, computeNextHead, collisionAt, moveSnake, nextScore, nextFood } from "./advance_parts";

/** Re-exported helper for tests that target the old path. */
export { computeNextHead as nextHead };

/**
 * Advance the pure game state by one tick. No side effects.
 * - Applies pending direction (reject 180° reverse)
 * - Computes next head
 * - Detects wall/self collisions
 * - Moves or grows the snake
 * - Updates score and (if needed) respawns food
 */
export function advance(state: GameState, rng: RNG): GameState {
  if (state.isGameOver) return state;

  // 1) Direction resolution
  const dir: Direction = resolveDirection(state.dir, state.pendingDir);

  // 2) Next head position
  const head = state.snake[0];
  const next = computeNextHead(head, dir);

  // 3) Collision
  const col = collisionAt(next, state);
  if (col) {
    return { ...state, dir, pendingDir: null, isGameOver: true };
  }

  // 4) Move snake and determine if we ate
  const { newSnake, ate } = moveSnake(state, next);

  // 5) Score + food
  const score = nextScore(state.score, ate);
  const food = nextFood(state, rng, ate);

  return {
    ...state,
    dir,
    pendingDir: null,
    snake: newSnake,
    food,
    score,
  };
}
