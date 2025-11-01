export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 800;
export const BACKGROUND_COLOR = 0x000000; 

export const PHYSICS = {
  default: "arcade",
  arcade: { gravity: { y: 0 }, debug: false },
} as const;