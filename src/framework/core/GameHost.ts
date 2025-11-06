// src/framework/core/GameHost.ts
import Phaser from "phaser";
import { defaultConfig, type CoreGameConfig } from "./config";
export type BootableScene = new (...args: any[]) => Phaser.Scene;
type SceneLike = Phaser.Scene | BootableScene;

function materializeScenes(scenes: SceneLike[]): Phaser.Scene[] {
  return scenes.map(s => (typeof s === "function" ? new (s as any)() : s));
}

export class GameHost {
  static launch(parent: string, scenes: SceneLike[], cfg?: Partial<CoreGameConfig>) {
    const c = { ...defaultConfig, ...(cfg || {}) };

    const scale =
      c.scaleMode === "fit"
        ? { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: c.width, height: c.height }
        : c.scaleMode === "cover"
        ? { mode: Phaser.Scale.ENVELOP, autoCenter: Phaser.Scale.CENTER_BOTH, width: c.width, height: c.height }
        : { mode: Phaser.Scale.RESIZE };

    const physics =
      !c.physics
        ? undefined
        : c.physics.system === "arcade"
        ? { default: "arcade", arcade: c.physics.arcade ?? { gravity: { x: 0, y: 0 }, debug: false } }
        : { default: "matter", matter: c.physics.matter };

    return new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      backgroundColor: c.backgroundColor,
      pixelArt: c.pixelArt ?? true,
      antialias: c.antialias ?? false,
      scale,
      physics,
      scene: materializeScenes(scenes),
    });
  }
}