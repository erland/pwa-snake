// src/game/SnakeBootScene.ts
import { snakeTheme } from "./theme";
import { BaseBootScene } from "../framework/scenes/BaseBootScene";
import { createDefaultServices } from "../framework/core/services";

export default class SnakeBootScene extends BaseBootScene {
  create(): void {
    // Build default services, then enable config-based fullscreen for BaseMenuScene.
    const base = createDefaultServices(undefined, snakeTheme);
    const services = {
      ...base,
      ui: { ...(base as any).ui, autoFullscreen: true }, // ← toggle here
    };
    // Register services first so MainMenu can read them
    this.game.registry.set("services", services);
    super.create(); // calls configureScale() and then start("MainMenu")
  }

  protected preloadAssets(): void {
    // Optionally preload bitmap font/atlas/audio.
    // this.load.image("food", "assets/food.png");
  }
}