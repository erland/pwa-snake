import Phaser from "phaser";
import { Dir4 } from "./Dir4";

export type SwipeOptions = {
  minDistance?: number;     // px, default 24 (before DPR)
  maxTapTimeMs?: number;    // default 180
  scaleWithDPR?: boolean;   // default true
};

/** Very small swipe detector that emits a Dir4 once per swipe end. */
export class SwipeDetector {
  private scene: Phaser.Scene;
  private minDistance: number;
  private maxTapTimeMs: number;
  private start?: { x: number; y: number; t: number; id: number };

  constructor(scene: Phaser.Scene, opts: SwipeOptions = {}) {
    this.scene = scene;
    const dpr = (typeof window !== "undefined" && window.devicePixelRatio) ? window.devicePixelRatio : 1;
    const base = opts.minDistance ?? 24;
    this.minDistance = (opts.scaleWithDPR ?? true) ? Math.round(base * dpr) : base;
    this.maxTapTimeMs = opts.maxTapTimeMs ?? 180;

    // listeners
    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    // We don't need move tracking beyond last pos; deltas are calculated on UP from start->end.
  }

  public destroy() {
    this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.onUp, this);
  }

  private onDown(pointer: Phaser.Input.Pointer) {
    this.start = { x: pointer.x, y: pointer.y, t: performance.now(), id: pointer.id };
  }

  private onUp(pointer: Phaser.Input.Pointer) {
    if (!this.start || this.start.id !== pointer.id) return;
    const dt = performance.now() - this.start.t;
    const dx = pointer.x - this.start.x;
    const dy = pointer.y - this.start.y;
    const ax = Math.abs(dx), ay = Math.abs(dy);

    this.start = undefined;

    // short motion: ignore (tap reserved for UI / separate handler)
    if (ax < this.minDistance && ay < this.minDistance) return;
    if (dt <= this.maxTapTimeMs && ax < this.minDistance && ay < this.minDistance) return;

    const dir: Dir4 = ax > ay ? (dx > 0 ? Dir4.Right : Dir4.Left) : (dy > 0 ? Dir4.Down : Dir4.Up);
    this.emit?.(dir);
  }

  /** Hook injected by controller */
  public emit?: (dir: Dir4) => void;
}
