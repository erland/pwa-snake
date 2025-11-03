import type { SceneKeys } from "../scenes/sceneKeys";
import type { Theme } from "../ui/Theme";
// src/framework/core/types.ts
import type { RNG } from "./rng";
import type { EventBus } from "./events";

export type Vec2 = { 
  x: number; 
  y: number;   
  theme?: Theme;
  sceneKeys?: SceneKeys;
};

export interface UIConfig { autoFullscreen?: boolean; }

export type GameServices = {
  rng?: RNG;
  events?: EventBus;
  fixedStepHz?: number;  // default 60
  // future: storage?, audio?, net?, analytics?
  theme?: Theme;
  sceneKeys?: SceneKeys;
  ui?: UIConfig;
};

export type FixedStepConfig = { hz?: number; maxCatchUp?: number; theme?: Theme;
  sceneKeys?: SceneKeys;
};