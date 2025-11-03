import Phaser from "phaser";
import * as L from "./logic";

/**
 * SnakeRenderer draws the board, snake, and food into a dedicated Graphics object
 * under a provided root container (which can be scaled/centered externally).
 */
export class SnakeRenderer {
  private scene: Phaser.Scene;
  private root: Phaser.GameObjects.Container;
  private gfx: Phaser.GameObjects.Graphics;
  private disposed = false;

  // Colors (kept here to make rendering self-contained & easy to theme later)
  private COLOR_BG    = 0x0b0b12;
  private COLOR_BDARK = 0x16203a;    // checkerboard dark
  private COLOR_BLITE = 0x1b2748;    // checkerboard light
  private COLOR_FRAME = 0x1c1c29;    // frame
  private COLOR_TILE  = 0xffffff;    // checker alpha
  private COLOR_FOOD  = 0xffe082;    // apple-ish
  private COLOR_EDGE  = 0x1b5e20;    // outline
  private COLOR_SNAKE = 0x43a047;    // body fill
  private COLOR_HEAD  = 0xa5d6a7;    // head highlight

  constructor(scene: Phaser.Scene, root: Phaser.GameObjects.Container) {
    this.scene = scene;
    this.root = root;
    this.gfx = scene.add.graphics();
    this.root.add(this.gfx);
  }

  /** Clear/draw entire frame based on provided state & animation pulse. */
  draw(state: L.GameState, pulse: number): void {
    if (this.disposed) return;
    const g = this.gfx;
    const tile = L.TILE_SIZE;
    const { cols, rows } = state.grid;
    const w = cols * tile;
    const h = rows * tile;

    g.clear();

    // checkerboard
    if (tile >= 6) {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (((x ^ y) & 1) === 0) {
            g.fillStyle(this.COLOR_BLITE, 1).fillRect(x * tile, y * tile, tile, tile);
          } else {
            g.fillStyle(this.COLOR_BDARK, 1).fillRect(x * tile, y * tile, tile, tile);
          }
        }
      }
    }

    // frame
    const border = Math.max(2, Math.floor(tile / 8));
    g.fillStyle(this.COLOR_FRAME, 0.85);
    g.fillRect(0, 0, w, border);
    g.fillRect(0, h - border, w, border);
    g.fillRect(0, 0, border, h);
    g.fillRect(w - border, 0, border, h);

    // food (pulsing)
    const f = state.food;
    const cx = f.x * tile + tile / 2;
    const cy = f.y * tile + tile / 2;
    const baseR = Math.max(3, Math.floor(tile * 0.33));
    const r = baseR * (1 + 0.06 * Math.sin(pulse * 0.5));
    g.fillStyle(this.COLOR_FOOD, 1).fillCircle(cx, cy, r);

    // snake
    const outline = Math.max(1, Math.floor(tile * 0.10));
    const headRadius = Math.max(0, Math.floor(tile * 0.22));
    for (let i = 0; i < state.snake.length; i++) {
      const s = state.snake[i];
      const x = s.x * tile;
      const y = s.y * tile;
      const isHead = i === 0;
      const radius = isHead ? headRadius : Math.max(0, Math.floor(tile * 0.2));

      g.fillStyle(this.COLOR_EDGE, 0.6).fillRoundedRect(x, y, tile, tile, radius);
      g.fillStyle(isHead ? this.COLOR_HEAD : this.COLOR_SNAKE, 1)
        .fillRoundedRect(x + outline, y + outline, tile - 2 * outline, tile - 2 * outline, Math.max(0, radius - outline));

      if (isHead && tile >= 8) {
        const eyeR = Math.max(1, Math.floor(tile * 0.08));
        const eyeOffset = Math.max(1, Math.floor(tile * 0.22));
        const front = Math.max(1, Math.floor(tile * 0.28));
        let ex1 = x + tile / 2, ey1 = y + tile / 2;
        let ex2 = ex1,            ey2 = ey1;
        switch (state.dir) {
          case "right": ex1 += front; ex2 += front; ey1 -= eyeOffset; ey2 += eyeOffset; break;
          case "left":  ex1 -= front; ex2 -= front; ey1 -= eyeOffset; ey2 += eyeOffset; break;
          case "up":    ey1 -= front; ey2 -= front; ex1 -= eyeOffset; ex2 += eyeOffset; break;
          case "down":  ey1 += front; ey2 += front; ex1 -= eyeOffset; ex2 += eyeOffset; break;
        }
        g.fillStyle(0x111318, 1).fillCircle(ex1, ey1, eyeR).fillCircle(ex2, ey2, eyeR);
      }
    }
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    try { this.gfx.destroy(); } catch {}
    // children are owned by scene display list; graphics removal is enough
  }
}
