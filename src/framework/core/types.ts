// src/framework/core/types.ts
import type { RNG } from "./rng";
import type { EventBus } from "./events";

export type Vec2 = { x: number; y: number };

export type GameServices = {
  rng?: RNG;
  events?: EventBus;
  fixedStepHz?: number;  // default 60
  // future: storage?, audio?, net?, analytics?
};

export type FixedStepConfig = { hz?: number; maxCatchUp?: number };