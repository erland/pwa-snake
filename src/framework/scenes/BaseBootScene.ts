import { defaultSceneKeys, type SceneKeys } from "./sceneKeys";
import Phaser from "phaser";

export abstract class BaseBootScene extends Phaser.Scene {
  protected getSceneKeys(): SceneKeys {
    const services: any = this.game.registry.get("services");
    return (services && services.sceneKeys) || defaultSceneKeys;
  }
  constructor() { super("Boot"); }

  /** Override to preload assets; keep super.preload() at top if you extend further. */
  preload(): void {
    // Default: no assets. Subclasses load atlases/fonts/audio here.
    this.preloadAssets();
  }

  /** Hook for subclass to load assets. */
  protected preloadAssets(): void {}

  create(): void {
    this.configureScale();
    this.onBootComplete();
  }

  /** Subclass may configure scale/background/etc. */
  protected configureScale() {
    // Respect mode chosen by GameHost; do not override here.
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;
  }

  /** Go to the first scene (menu by default). */
  protected onBootComplete() {
    this.scene.start(this.getSceneKeys().menu);
  }
}