// src/game/SnakeBootScene.ts
import { snakeTheme } from "./theme";
import { BaseBootScene } from "../framework/scenes/BaseBootScene";

export default class SnakeBootScene extends BaseBootScene {
  /** Supply the game theme to the framework service builder. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected override getBootTheme(): any {
    return snakeTheme;
  }

  /** Enable config-based fullscreen for BaseMenuScene (and other UI flags if desired). */
  protected override getServiceOverrides() {
    return { ui: { autoFullscreen: true } };
  }

  protected preloadAssets(): void {
    // Optionally preload bitmap font/atlas/audio.
    // this.load.image("food", "assets/food.png");
  }
}
