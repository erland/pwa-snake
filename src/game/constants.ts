// src/game/constants.ts
import type { Direction, GridConfig } from "./types";

export const GRID: GridConfig = { cols: 20, rows: 20 };
export const STEP_MS = 150;
export const START_LEN = 3;
export const START_DIR: Direction = "right";
export const TILE_SIZE_PX = 16;
