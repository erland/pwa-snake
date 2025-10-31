// src/game/logic/types.ts
export type Point = { x: number; y: number };

export type Direction = "up" | "down" | "left" | "right";

export interface GridConfig {
  cols: number; // e.g., 20
  rows: number; // e.g., 20
}

export interface GameConfig {
  stepMs: number;   // e.g., 150
  startLen: number; // e.g., 3
  startDir: Direction; // e.g., "right"
}

export interface GameState {
  grid: GridConfig;
  dir: Direction;
  pendingDir: Direction | null; // set on key press, applied at tick if valid
  snake: Point[];               // head at index 0
  food: Point;
  score: number;
  isGameOver: boolean;
}
