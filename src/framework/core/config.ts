// src/framework/core/config.ts
import type Phaser from "phaser";

export type ScaleMode = "resize" | "fit" | "cover";

export type PhysicsConfig =
  | false
  | { system: "arcade"; arcade?: Phaser.Types.Physics.Arcade.ArcadeWorldConfig }
  | { system: "matter"; matter?: Phaser.Types.Physics.Matter.MatterWorldConfig };

export interface CoreGameConfig {
  width: number;
  height: number;
  backgroundColor: number;
  pixelArt?: boolean;
  antialias?: boolean;
  scaleMode?: ScaleMode;
  physics?: PhysicsConfig;
}

export const defaultConfig: CoreGameConfig = {
  width: 480,
  height: 800,
  backgroundColor: 0x000000,
  pixelArt: true,
  antialias: false,
  scaleMode: "resize",
  physics: false, // default to no physics at framework level
};