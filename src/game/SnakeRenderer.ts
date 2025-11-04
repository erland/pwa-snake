import Phaser from "phaser";
import * as L from "./logic";

type Palette = {
  bg: number;      // background (behind board)
  dark: number;    // checkerboard dark
  light: number;   // checkerboard light
  frame: number;   // board frame/border
  food: number;    // apple/food
  edge: number;    // snake outline
  snake: number;   // snake body
  head: number;    // head highlight
};

export type SnakeRendererOptions = {
  tileSize: number;
  palette?: Partial<Palette>;
};

/**
 * SnakeRenderer draws the board, snake (rounded with eyes), and pulsing food
 * into a dedicated Graphics object under the provided root container.
 */
export class SnakeRenderer {
  private scene: Phaser.Scene;
  private root: Phaser.GameObjects.Container;
  private gfx: Phaser.GameObjects.Graphics;
  private disposed = false;

  private tile: number;
  private colors: Palette;

  constructor(scene: Phaser.Scene, root: Phaser.GameObjects.Container, opts: SnakeRendererOptions) {
    this.scene = scene;
    this.root = root;
    this.gfx = scene.add.graphics();
    this.root.add(this.gfx);

    // Defaults match your previous look-and-feel
    const defaults: Palette = {
      bg: 0x0b0b12,
      dark: 0x16203a,
      light: 0x1b2748,
      frame: 0x1c1c29,
      food: 0xffe082,
      edge: 0x1b5e20,
      snake: 0x43a047,
      head: 0xa5d6a7,
    };

    this.tile = opts.tileSize;
    this.colors = { ...defaults, ...(opts.palette ?? {}) };
  }

  /** Clear/draw entire frame based on provided state & animation pulse. */
  draw(state: L.GameState, pulse: number): void {
    if (this.disposed) return;

    const g = this.gfx;
    const tile = this.tile;
    const { cols, rows } = state.grid;
    const w = cols * tile;
    const h = rows * tile;

    g.clear();

    // Optional solid bg behind the checker (kept subtle)
    g.fillStyle(this.colors.bg, 1).fillRect(0, 0, w, h);

    // Checkerboard (skip on tiny tiles to reduce overdraw)
    if (tile >= 6) {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const c = ((x ^ y) & 1) === 0 ? this.colors.light : this.colors.dark;
          g.fillStyle(c, 1).fillRect(x * tile, y * tile, tile, tile);
        }
      }
    }

    // Frame/border
    const border = Math.max(2, Math.floor(tile / 8));
    g.fillStyle(this.colors.frame, 0.85);
    g.fillRect(0, 0, w, border);
    g.fillRect(0, h - border, w, border);
    g.fillRect(0, 0, border, h);
    g.fillRect(w - border, 0, border, h);

    // Food (pulsing)
    {
      const f = state.food;
      const cx = f.x * tile + tile / 2;
      const cy = f.y * tile + tile / 2;
      const baseR = Math.max(3, Math.floor(tile * 0.33));
      const r = baseR * (1 + 0.06 * Math.sin(pulse * 0.5));
      g.fillStyle(this.colors.food, 1).fillCircle(cx, cy, r);
    }

    // Snake (rounded tiles + outline + eyes on head)
    const outline = Math.max(1, Math.floor(tile * 0.10));
    const headRadius = Math.max(0, Math.floor(tile * 0.22));
    for (let i = 0; i < state.snake.length; i++) {
      const seg = state.snake[i];
      const x = seg.x * tile;
      const y = seg.y * tile;
      const isHead = i === 0;
      const radius = isHead ? headRadius : Math.max(0, Math.floor(tile * 0.2));

      // Outer outline
      g.fillStyle(this.colors.edge, 0.6).fillRoundedRect(x, y, tile, tile, radius);

      // Inner fill
      const innerColor = isHead ? this.colors.head : this.colors.snake;
      g.fillStyle(innerColor, 1).fillRoundedRect(
        x + outline,
        y + outline,
        tile - 2 * outline,
        tile - 2 * outline,
        Math.max(0, radius - outline)
      );

      // Eyes on head
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
  }
}