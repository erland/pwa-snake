// src/framework/index.ts
// Public, stable entry for the framework. Re-export only the supported surface.
// If you deprecate anything, keep it re-exported for one minor release and mark with a JSDoc @deprecated.

// Core
export { GameHost } from "./core/GameHost";
export type { GameServices } from "./core/types";
export { defaultSceneKeys } from "./scenes/sceneKeys";

// Inputs
export { DirectionalInputController } from "./input/DirectionalInputController";
export { Dir4 } from "./input/Dir4";
export { SwipeDetector } from "./input/SwipeDetector";
export { BaseInputController } from "./input/BaseInputController";

// Scenes
export { BaseBootScene } from "./scenes/BaseBootScene";
export { BaseMenuScene } from "./scenes/BaseMenuScene";
export { BasePlayScene } from "./scenes/BasePlayScene";
export { BasePauseOverlay } from "./scenes/BasePauseOverlay";
export { BaseGameOverScene } from "./scenes/BaseGameOverScene";

// UI & helpers
export { defaultTheme } from "./ui/defaultTheme";
export type { Theme } from "./ui/Theme";
export { DPadOverlay } from "./ui/DPadOverlay";
export { BoardFitter } from "./scene-helpers/BoardFitter";
export { requestFullscreenIfPossible } from "./utils/fullscreen";

// Events & RNG
export { events, EVT } from "./core/events";
export type { RNG } from "./core/rng";
export { MathRNG, LCG, SeqRNG, randomInt } from "./core/rng";
