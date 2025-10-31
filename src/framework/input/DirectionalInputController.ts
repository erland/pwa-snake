import Phaser from "phaser";
import { BaseInputController } from "./BaseInputController";
import { Dir4 } from "./Dir4";
import { SwipeDetector } from "./SwipeDetector";

export type DirectionalInputOptions = {
  allowKeyboard?: boolean;   // default true
  allowWASD?: boolean;       // default true
  allowSwipe?: boolean;      // default true
  throttleMs?: number;       // default 60ms
  swipeMinDistance?: number; // default 24px (games can set 12px)
};

export abstract class DirectionalInputController extends BaseInputController {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<"W"|"A"|"S"|"D", Phaser.Input.Keyboard.Key>;
  private swipe?: SwipeDetector;
  private lastEmit = 0;
  private opts!: Required<DirectionalInputOptions>;

  constructor(scene: Phaser.Scene, opts: DirectionalInputOptions = {}) {
    super(scene);
    this.opts = {
      allowKeyboard: opts.allowKeyboard ?? true,
      allowWASD: opts.allowWASD ?? true,
      allowSwipe: opts.allowSwipe ?? true,
      throttleMs: opts.throttleMs ?? 60,
      swipeMinDistance: opts.swipeMinDistance ?? 24,
    };
  }

  protected onAttach(): void {
    if (this.opts.allowKeyboard) {
      this.cursors = this.scene.input.keyboard!.createCursorKeys();
    }
    if (this.opts.allowWASD) {
      const kbd = this.scene.input.keyboard!;
      this.wasd = {
        W: kbd.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: kbd.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: kbd.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: kbd.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }
    if (this.opts.allowSwipe) {
      this.swipe = new SwipeDetector(this.scene, { minDistance: this.opts.swipeMinDistance });
      this.swipe.emit = (dir) => this.tryEmit(dir);
    }
  }

  public poll(): void {
    const pressed = (k?: Phaser.Input.Keyboard.Key) => !!k && Phaser.Input.Keyboard.JustDown(k);
    if (this.cursors) {
      if (pressed(this.cursors.left))  this.tryEmit(Dir4.Left);
      else if (pressed(this.cursors.right)) this.tryEmit(Dir4.Right);
      else if (pressed(this.cursors.up))    this.tryEmit(Dir4.Up);
      else if (pressed(this.cursors.down))  this.tryEmit(Dir4.Down);
    }
    if (this.wasd) {
      if (pressed(this.wasd.A)) this.tryEmit(Dir4.Left);
      else if (pressed(this.wasd.D)) this.tryEmit(Dir4.Right);
      else if (pressed(this.wasd.W)) this.tryEmit(Dir4.Up);
      else if (pressed(this.wasd.S)) this.tryEmit(Dir4.Down);
    }
  }

  public destroy(): void {
    this.swipe?.destroy();
  }

  private tryEmit(dir: Dir4) {
    const now = performance.now();
    if (now - this.lastEmit < this.opts.throttleMs) return;
    this.lastEmit = now;
    this.onDirection(dir);
  }

  protected abstract onDirection(dir: Dir4): void;
}