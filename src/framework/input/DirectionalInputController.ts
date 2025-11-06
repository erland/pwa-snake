import Phaser from "phaser";
import { BaseInputController } from "./BaseInputController";
import { Dir4 } from "./Dir4";
import { SwipeDetector } from "./SwipeDetector";
import { KeyboardReader } from "./readers/KeyboardReader";
import { GamepadReader } from "./readers/GamepadReader";
import { Repeater } from "./Repeater";

export type DirectionalInputOptions = {
  // Toggles
  allowKeyboard?: boolean;     // default true
  allowWASD?: boolean;         // retained for convenience (affects KeyboardReader default)
  allowSwipe?: boolean;        // default true
  allowGamepad?: boolean;      // default true

  // Keyboard bindings (overrides allowWASD if provided)
  bindings?: {
    up?: number[];
    down?: number[];
    left?: number[];
    right?: number[];
  };

  // Repeat/Throttle
  throttleMs?: number;         // time before first repeat (also used as repeatEvery if not provided)
  repeatMode?: "edge" | "repeat";
  repeatEveryMs?: number;      // if omitted, uses throttleMs

  // Gamepad
  deadzone?: number;

  // Swipe
  swipeMinDistance?: number;   // px; default 24
};

export abstract class DirectionalInputController extends BaseInputController {
  private opts: DirectionalInputOptions;
  private swipe?: SwipeDetector;

  private kbd?: KeyboardReader;
  private pad?: GamepadReader;
  private repeater: Repeater;

  private lastSwipe: Dir4 | null = null;

  constructor(scene: Phaser.Scene, opts: DirectionalInputOptions = {}) {
    super(scene);
    this.opts = {
      allowKeyboard: opts.allowKeyboard ?? true,
      allowWASD: opts.allowWASD ?? true,
      allowSwipe: opts.allowSwipe ?? true,
      allowGamepad: opts.allowGamepad ?? true,
      throttleMs: opts.throttleMs ?? 60,
      repeatMode: opts.repeatMode ?? "repeat",
      repeatEveryMs: opts.repeatEveryMs,
      deadzone: opts.deadzone ?? 0.25,
      swipeMinDistance: opts.swipeMinDistance ?? 24,
      bindings: opts.bindings,
    };

    this.repeater = new Repeater(this.opts.repeatMode!, this.opts.throttleMs!, this.opts.repeatEveryMs);
  }

  protected onAttach(): void {
    if (this.opts.allowKeyboard) {
      this.kbd = new KeyboardReader(this.scene, this.opts.bindings ? {
        [Dir4.Up]: this.opts.bindings.up,
        [Dir4.Down]: this.opts.bindings.down,
        [Dir4.Left]: this.opts.bindings.left,
        [Dir4.Right]: this.opts.bindings.right,
      } : undefined);
    }

    if (this.opts.allowGamepad) {
      this.pad = new GamepadReader(this.scene, this.opts.deadzone);
    }

    if (this.opts.allowSwipe) {
      this.swipe = new SwipeDetector(this.scene, { minDistance: this.opts.swipeMinDistance });
      this.swipe.emit = (d) => { this.lastSwipe = d; };
    }
  }

  protected onPoll(): void {
    const now = this.scene.time.now;

    const read = () => {
      if (this.lastSwipe) {
        const d = this.lastSwipe;
        this.lastSwipe = null;
        return d;
      }
      const fromKbd = this.kbd?.read() ?? null;
      if (fromKbd) return fromKbd;
      const fromPad = this.pad?.read() ?? null;
      if (fromPad) return fromPad;
      return null;
    };

    this.repeater.tick(now, read, (dir) => this.onDirection(dir));
  }

  public destroy(): void {
    this.swipe?.destroy();
  }

  /** Subclass hook to handle a direction event. */
  protected abstract onDirection(dir: Dir4): void;
}