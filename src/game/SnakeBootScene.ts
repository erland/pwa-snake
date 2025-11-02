import { snakeTheme } from "./theme";
// src/game/SnakeBootScene.ts
import { BaseBootScene } from "../framework/scenes/BaseBootScene";
import { createDefaultServices } from "../framework/core/services";

export default class SnakeBootScene extends BaseBootScene {
  create(): void {
    // Register services first so MainMenu can read them
    this.game.registry.set("services", createDefaultServices(undefined, snakeTheme));
    super.create(); // this will call configureScale() and then start("MainMenu")
  }

  protected preloadAssets(): void {
    // Optionally preload bitmap font/atlas/audio.
    // this.load.image("food", "assets/food.png");
  }
}