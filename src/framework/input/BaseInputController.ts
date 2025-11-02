import Phaser from "phaser";

/**
 * Minimal input controller base with a stable lifecycle API.
 * Scenes should call controller.attach() once after construction,
 * poll() every frame (e.g., in Scene.update), and destroy() on shutdown.
 */
export abstract class BaseInputController {
  protected scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Call once after constructing the controller. */
  public attach(): void {
    this.onAttach();
  }

  /** Called each frame by the scene. */
  public poll(): void {
    this.onPoll();
  }

  /** Called when the scene shuts down. Subclasses may override. */
  public destroy(): void {
    // no-op
  }

  /** Subclass hook: set up listeners (keys, pointers, gestures, gamepad). */
  protected abstract onAttach(): void;

  /** Subclass hook: per-frame polling (read inputs, emit actions). */
  protected abstract onPoll(): void;
}
