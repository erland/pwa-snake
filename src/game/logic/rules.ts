// src/game/logic/rules.ts
import type { GridConfig, Point } from "./types";
import type { RNG } from "../../framework/core/rng";
import { randomInt } from "../../framework/core/rng";

export function pointEq(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

export function hitsWall(p: Point, grid: GridConfig): boolean {
  return p.x < 0 || p.y < 0 || p.x >= grid.cols || p.y >= grid.rows;
}

export function hitsSelf(p: Point, snake: Point[]): boolean {
  // head will be compared against body when moving; here we check if p collides any segment
  return snake.some(seg => seg.x === p.x && seg.y === p.y);
}

export function placeFood(snake: Point[], grid: GridConfig, rng: RNG): Point {
  // Build list of free cells
  const occupied = new Set(snake.map(seg => `${seg.x},${seg.y}`));
  const free: Point[] = [];
  for (let y = 0; y < grid.rows; y++) {
    for (let x = 0; x < grid.cols; x++) {
      const k = `${x},${y}`;
      if (!occupied.has(k)) free.push({ x, y });
    }
  }
  if (free.length === 0) {
    // Grid is full (shouldn't happen in v1). Return (0,0) as a harmless fallback.
    // Rendering/input side may treat full grid as game complete if ever needed.
    return { x: 0, y: 0 };
  }
  const idx = randomInt(rng, free.length);
  return free[idx];
}
