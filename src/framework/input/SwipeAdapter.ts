import { Dir4 } from "./Dir4";
import { SwipeDetector } from "./SwipeDetector";

export class SwipeAdapter {
  private swipe: SwipeDetector;
  private last: Dir4 | null = null;

  constructor(scene: Phaser.Scene, minDistance = 24) {
    this.swipe = new SwipeDetector(scene, { minDistance });
  }

  read(): Dir4 | null {
    const s = this.swipe.consume(); // assume you expose a way to read & reset
    if (!s) return null;
    if (s.dx && Math.abs(s.dx) > Math.abs(s.dy)) {
      this.last = s.dx < 0 ? Dir4.Left : Dir4.Right;
    } else if (s.dy) {
      this.last = s.dy < 0 ? Dir4.Up : Dir4.Down;
    }
    const out = this.last;
    this.last = null;
    return out;
  }
}