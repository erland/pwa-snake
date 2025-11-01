import Phaser from "phaser";
import { BACKGROUND_COLOR, GAME_HEIGHT, GAME_WIDTH, PHYSICS } from "./config";

export type BootableScene = new (...args: any[]) => Phaser.Scene;

export class GameHost {
  static launch(parent: string, scenes: Phaser.Scene[]) {
    return new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      backgroundColor: BACKGROUND_COLOR,
      pixelArt: true,
      antialias: false,
      scale: { mode: Phaser.Scale.RESIZE },
      scene: scenes,
    });
  }
}