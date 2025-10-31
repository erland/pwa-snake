export type Vec2 = { x: number; y: number };

export type GameServices = {
  rngSeed?: number;
  // add DI-style services here later (audio, storage, net, etc.)
};

export type FixedStepConfig = {
  hz?: number;        // default 60
  maxCatchUp?: number; // default 5 steps
};