import { BaseBootScene } from "../framework/scenes/BaseBootScene";

export default class SnakeBootScene extends BaseBootScene {
  protected preloadAssets(): void {
    // Optionally preload bitmap font/atlas/audio.
    // this.load.image("food", "assets/food.png");
  }
}