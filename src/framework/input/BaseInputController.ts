import Phaser from "phaser";

export abstract class BaseInputController {
  protected scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    // Do NOT call onAttach() here; subclass state may not be ready yet.
  }

  /** Call once after constructing the controller (scene will do this). */
  public attach(): void {
    this.onAttach();
  }

  /** Subclasses set up listeners (keys, pointers, gestures). */
  protected onAttach(): void {}

  /** Called from PlayScene.update for per-frame polling. */
  public poll(): void {}

  /** Cleanup when scene shuts down. */
  public destroy(): void {}
}