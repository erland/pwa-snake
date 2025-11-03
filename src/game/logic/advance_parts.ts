// src/game/logic/advance_parts.ts
import type { Direction, GameState, Point } from "./types";
import { dirToVec, isOpposite } from "./direction";
import { hitsSelf, hitsWall, pointEq, placeFood } from "./rules";
import type { RNG } from "../../framework";

/** Choose a new direction, rejecting 180° reversals. */
export function resolveDirection(current: Direction, pending: Direction | null): Direction {
  if (!pending) return current;
  return isOpposite(pending, current) ? current : pending;
}

/** Compute the next head position from a direction. */
export function computeNextHead(head: Point, dir: Direction): Point {
  const v = dirToVec(dir);
  return { x: head.x + v.x, y: head.y + v.y };
}

/** Check for wall/self collisions at a point. */
export function collisionAt(p: Point, state: GameState): "wall" | "self" | null {
  if (hitsWall(p, state.grid)) return "wall";
  // Compare against the body excluding the last tail segment.
  const body = state.snake.slice(0, -1);
  return hitsSelf(p, body) ? "self" : null;
}

/** Apply one movement step, returning new snake array and whether we ate food. */
export function moveSnake(state: GameState, nextHead: Point): { newSnake: Point[]; ate: boolean } {
  const ate = pointEq(nextHead, state.food);
  const newSnake = [nextHead, ...state.snake];
  if (!ate) newSnake.pop(); // regular move
  return { newSnake, ate };
}

/** Update score with a simple +1 rule; customize here if needed. */
export function nextScore(current: number, ate: boolean): number {
  return ate ? current + 1 : current;
}

/** Possibly place new food if we just ate; otherwise keep old food. */
export function nextFood(state: GameState, rng: RNG, ate: boolean): Point {
  return ate ? placeFood(state.snake, state.grid, rng) : state.food;
}
