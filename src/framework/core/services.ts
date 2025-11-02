import { defaultSceneKeys, type SceneKeys } from "../scenes/sceneKeys";
import { defaultTheme } from "../ui/defaultTheme";
// src/framework/core/services.ts
import { events } from "./events";
import { MathRNG, type RNG } from "./rng";
import type { GameServices } from "./types.ts";

export function createDefaultServices(seed?: number, theme = defaultTheme, sceneKeys: SceneKeys = defaultSceneKeys): GameServices {
  // Swap to a seeded RNG if you like; keeping MathRNG by default
  const rng: RNG = new MathRNG();
  return { rng, events, fixedStepHz: 60, theme, sceneKeys };
}