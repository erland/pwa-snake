// src/game/step.ts
import type { Direction, GameState, Point } from "./types";
import { dirToVec, isOpposite } from "./direction";
import { hitsSelf, hitsWall, pointEq, placeFood } from "./rules";
import type { Random } from "./rng";

export function nextHead(head: Point, dir: Direction): Point {
  const v = dirToVec(dir);
  return { x: head.x + v.x, y: head.y + v.y };
}

export function advance(state: GameState, rng: Random): GameState {
  if (state.isGameOver) return state; // frozen

  // Apply pending direction if valid
  let dir = state.dir;
  if (state.pendingDir && !isOpposite(state.dir, state.pendingDir)) {
    dir = state.pendingDir;
  }

  const currentHead = state.snake[0];
  const newHead = nextHead(currentHead, dir);

  if (hitsWall(newHead, state.grid) || hitsSelf(newHead, state.snake)) {
    return {
      ...state,
      isGameOver: true
    };
  }

  // Move: add new head
  const newSnake = [newHead, ...state.snake];
  let score = state.score;
  let food = state.food;

  if (pointEq(newHead, state.food)) {
    // Grow: keep tail; respawn food
    score += 1;
    food = placeFood(newSnake, state.grid, rng);
  } else {
    // Regular move: drop tail
    newSnake.pop();
  }

  return {
    ...state,
    dir,
    pendingDir: null,
    snake: newSnake,
    food,
    score
  };
}
