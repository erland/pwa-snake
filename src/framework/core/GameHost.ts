import Phaser from "phaser";
import { BACKGROUND_COLOR, GAME_HEIGHT, GAME_WIDTH, PHYSICS } from "./config";

export type BootableScene = new (...args: any[]) => Phaser.Scene;

export class GameHost {
  static launch(parent: string, scenes: Phaser.Scene[]) {
    return new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: BACKGROUND_COLOR,
      physics: PHYSICS,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: scenes,
    });
  }
}