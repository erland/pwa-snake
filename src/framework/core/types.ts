// src/framework/core/types.ts
import type { RNG } from "./rng";
import type { EventBus } from "./events";

export type Vec2 = { x: number; y: number };

export interface UIConfig { autoFullscreen?: boolean; }

export type GameServices = {
  rng?: RNG;
  events?: EventBus;
  fixedStepHz?: number;  // default 60
  ui?: UIConfig;
};

export type FixedStepConfig = {
  hz?: number;          // default 60
  maxCatchUp?: number;  // max steps per frame to prevent spiral
};