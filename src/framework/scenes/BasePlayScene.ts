import Phaser from "phaser";
import { FixedStepper } from "../core/time";
import { BaseInputController } from "../input/BaseInputController";

export abstract class BasePlayScene extends Phaser.Scene {
  private stepper: FixedStepper;
  private inputCtrl?: BaseInputController;

  constructor(private cfg: { hz?: number; maxCatchUp?: number } = {}) {
    super("Play");
    this.stepper = new FixedStepper(cfg.hz ?? 60, cfg.maxCatchUp ?? 5);
  }

  /** Subclass returns an input controller (optional). */
  protected createInput(): BaseInputController | undefined { return undefined; }

  /** Subclass draws HUD/world static parts. */
  protected abstract buildWorld(): void;

  /** Subclass updates deterministic game state per fixed step. */
  protected abstract tick(dtMs: number): void;

  /** Optional per-frame render/update (vfx). */
  protected frame(deltaMs: number): void {}

  create() {
    this.buildWorld();
    this.inputCtrl = this.createInput();
    this.inputCtrl?.attach(); // attach AFTER subclass ctor runs
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.inputCtrl?.destroy();
    });
    this.onCreated();
  }

  /** Additional hook after world+input. */
  protected onCreated(): void {}

  update(_: number, delta: number) {
    this.inputCtrl?.poll();
    this.stepper.tick(delta, (dt) => this.tick(dt));
    this.frame(delta);
  }

  shutdown() {
    this.inputCtrl?.destroy();
  }
}