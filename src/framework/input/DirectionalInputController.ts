import Phaser from "phaser";
import { BaseInputController } from "./BaseInputController";
import { Dir4 } from "./Dir4";
import { SwipeDetector } from "./SwipeDetector";

export type DirectionalInputOptions = {
  // Toggles
  allowKeyboard?: boolean;     // default true
  allowWASD?: boolean;         // default true (retained for convenience)
  allowSwipe?: boolean;        // default true
  allowGamepad?: boolean;      // default true

  // Keyboard bindings (overrides allowWASD if provided)
  bindings?: {
    up?: Phaser.Input.Keyboard.KeyCodes[];
    down?: Phaser.Input.Keyboard.KeyCodes[];
    left?: Phaser.Input.Keyboard.KeyCodes[];
    right?: Phaser.Input.Keyboard.KeyCodes[];
  };

  // Behavior
  throttleMs?: number;         // default 60 (repeat pacing)
  repeatMode?: "edge" | "repeat"; // default "repeat"
  repeatEveryMs?: number;      // optional override when repeatMode === "repeat"

  // Swipe
  swipeMinDistance?: number;   // default 24
  // SwipeDetector also supports scaleWithDPR and maxTapTimeMs; use defaults for now

  // Gamepad
  deadzone?: number;           // default 0.25
};

export abstract class DirectionalInputController extends BaseInputController {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: Record<"W"|"A"|"S"|"D", Phaser.Input.Keyboard.Key>;
  private custom: { up: Phaser.Input.Keyboard.Key[]; down: Phaser.Input.Keyboard.Key[]; left: Phaser.Input.Keyboard.Key[]; right: Phaser.Input.Keyboard.Key[] } | undefined;
  private swipe?: SwipeDetector;
  protected opts: Required<Pick<DirectionalInputOptions,
    "allowKeyboard"|"allowWASD"|"allowSwipe"|"allowGamepad"|
    "throttleMs"|"repeatMode"|"deadzone">> & DirectionalInputOptions;

  private lastEmit = 0;
  private held: Partial<Record<Dir4, boolean>> = {};

  constructor(scene: Phaser.Scene, opts: DirectionalInputOptions = {}) {
    super(scene);
    this.opts = {
      allowKeyboard: opts.allowKeyboard ?? true,
      allowWASD: opts.allowWASD ?? true,
      allowSwipe: opts.allowSwipe ?? true,
      allowGamepad: opts.allowGamepad ?? true,
      throttleMs: opts.throttleMs ?? 60,
      repeatMode: opts.repeatMode ?? "repeat",
      deadzone: opts.deadzone ?? 0.25,
      ...opts,
    };
  }

  protected onAttach(): void {
    // Keyboard setup
    if (this.opts.allowKeyboard !== false) {
      const input = this.scene.input.keyboard!;
      this.cursors = input.createCursorKeys();

      // WASD convenience
      if (this.opts.allowWASD !== false) {
        this.wasd = {
          W: input.addKey(Phaser.Input.Keyboard.KeyCodes.W),
          A: input.addKey(Phaser.Input.Keyboard.KeyCodes.A),
          S: input.addKey(Phaser.Input.Keyboard.KeyCodes.S),
          D: input.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        };
      }

      // Custom bindings override/extend
      const b = this.opts.bindings;
      if (b) {
        const addKeys = (codes?: Phaser.Input.Keyboard.KeyCodes[]) =>
          (codes ?? []).map((code) => input.addKey(code));
        this.custom = {
          up: addKeys(b.up),
          down: addKeys(b.down),
          left: addKeys(b.left),
          right: addKeys(b.right),
        };
      }
    }

    // Swipe setup
    if (this.opts.allowSwipe !== false) {
      this.swipe = new SwipeDetector(this.scene, { minDistance: this.opts.swipeMinDistance ?? 24 });
      this.swipe.emit = (dir) => this.tryEmit(dir);
    }
  }

  protected onPoll(): void {
    // Keyboard
    if (this.opts.allowKeyboard !== false) {
      const dir = this.readKeyboard();
      if (dir) this.tryEmit(dir);
    }

    // Gamepad (polling)
    if (this.opts.allowGamepad !== false && this.scene.input.gamepad?.total) {
      const dir = this.readGamepad();
      if (dir) this.tryEmit(dir);
    }
  }

  public override destroy(): void {
    this.swipe?.destroy();
  }

  private readKeyboard(): Dir4 | undefined {
    const anyDown = (keys: Phaser.Input.Keyboard.Key[] | undefined, isDown: keyof Phaser.Input.Keyboard.Key = "isDown") =>
      keys?.some(k => (k as any)[isDown]) ?? false;

    // Arrow keys
    const c = this.cursors;
    const left  = !!c?.left?.isDown;
    const right = !!c?.right?.isDown;
    const up    = !!c?.up?.isDown;
    const down  = !!c?.down?.isDown;

    // WASD
    const w = this.wasd;
    const wUp = !!w?.W?.isDown, wDown = !!w?.S?.isDown, wLeft = !!w?.A?.isDown, wRight = !!w?.D?.isDown;

    // Custom
    const cu = anyDown(this.custom?.up);
    const cd = anyDown(this.custom?.down);
    const cl = anyDown(this.custom?.left);
    const cr = anyDown(this.custom?.right);

    // Resolve conflicts: horizontal beats vertical only when magnitude equal; here just pick priority: Left/Right then Up/Down.
    if (left || wLeft || cl)  return Dir4.Left;
    if (right || wRight || cr) return Dir4.Right;
    if (up || wUp || cu)      return Dir4.Up;
    if (down || wDown || cd)  return Dir4.Down;

    // Edge handling (reset held when no direction is pressed)
    this.held = {};
    return undefined;
  }

  private readGamepad(): Dir4 | undefined {
    const pads = this.scene.input.gamepad?.gamepads ?? [];
    const pad = pads.find(p => !!p) as Phaser.Input.Gamepad.Gamepad | undefined;
    if (!pad) return undefined;

    // Prefer digital dpad if available
    const left  = pad.isButtonDown(14);
    const right = pad.isButtonDown(15);
    const up    = pad.isButtonDown(12);
    const down  = pad.isButtonDown(13);
    if (left) return Dir4.Left;
    if (right) return Dir4.Right;
    if (up) return Dir4.Up;
    if (down) return Dir4.Down;

    // Then analog stick
    const x = pad.axes.length > 0 ? pad.axes[0].getValue() : 0;
    const y = pad.axes.length > 1 ? pad.axes[1].getValue() : 0;
    const dz = this.opts.deadzone ?? 0.25;
    const ax = Math.abs(x), ay = Math.abs(y);
    if (ax < dz && ay < dz) { this.held = {}; return undefined; }
    return ax > ay ? (x > 0 ? Dir4.Right : Dir4.Left) : (y > 0 ? Dir4.Down : Dir4.Up);
  }

  private tryEmit(dir: Dir4) {
    const now = performance.now();
    if (this.opts.repeatMode === "edge") {
      // Only on transition from not-held to held
      if (!this.held[dir]) {
        this.held[dir] = true;
        this.onDirection(dir);
      }
      return;
    }

    // repeat mode
    const every = this.opts.repeatEveryMs ?? this.opts.throttleMs;
    if (now - this.lastEmit < every) return;
    this.lastEmit = now;
    this.onDirection(dir);
  }

  protected abstract onDirection(dir: Dir4): void;
}
