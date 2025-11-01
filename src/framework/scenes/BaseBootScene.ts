import Phaser from "phaser";

export abstract class BaseBootScene extends Phaser.Scene {
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
    this.scale.scaleMode = Phaser.Scale.RESIZE;
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;
  }

  /** Go to the first scene (menu by default). */
  protected onBootComplete() {
    this.scene.start("MainMenu");
  }
}