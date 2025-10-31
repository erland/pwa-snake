import Phaser from "phaser";
import { Dir4 } from "./Dir4";

type Opts = {
  minDistance?: number; // pixels to qualify as a swipe
  maxTapTimeMs?: number; // treat quick short gestures as taps (ignored here)
};

export class SwipeDetector {
  private start?: { x: number; y: number; t: number };
  private readonly minDistance: number;
  private readonly maxTapTimeMs: number;

  constructor(private scene: Phaser.Scene, opts: Opts = {}) {
    this.minDistance = opts.minDistance ?? 24;
    this.maxTapTimeMs = opts.maxTapTimeMs ?? 250;

    scene.input.on("pointerdown", this.onDown, this);
    scene.input.on("pointerup", this.onUp, this);
  }

  destroy() {
    this.scene.input.off("pointerdown", this.onDown, this);
    this.scene.input.off("pointerup", this.onUp, this);
  }

  private onDown(p: Phaser.Input.Pointer) {
    this.start = { x: p.x, y: p.y, t: performance.now() };
  }

  private onUp(p: Phaser.Input.Pointer) {
    if (!this.start) return;
    const dx = p.x - this.start.x;
    const dy = p.y - this.start.y;
    const dt = performance.now() - this.start.t;
    const ax = Math.abs(dx), ay = Math.abs(dy);

    this.start = undefined;

    // too short in distance → ignore
    if (ax < this.minDistance && ay < this.minDistance) return;
    // taps (short+fast) could be handled elsewhere if needed
    if (dt <= this.maxTapTimeMs && ax < this.minDistance && ay < this.minDistance) return;

    const dir: Dir4 = ax > ay ? (dx > 0 ? Dir4.Right : Dir4.Left) : (dy > 0 ? Dir4.Down : Dir4.Up);
    this.emit?.(dir);
  }

  /** Hook injected by controller */
  public emit?: (dir: Dir4) => void;
}