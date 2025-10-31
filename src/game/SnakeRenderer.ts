// src/game/SnakeRenderer.ts
import Phaser from "phaser";
import type { Direction, Point } from "./logic";

export class SnakeRenderer {
  private gridG?: Phaser.GameObjects.Graphics;
  private snakeLayer?: Phaser.GameObjects.Container;
  private foodLayer?: Phaser.GameObjects.Container;
  private foodPulse?: Phaser.Tweens.Tween;

  constructor(
    private scene: Phaser.Scene,
    private tile: number,
    private grid: { cols: number; rows: number }
  ) {}

  init() {
    this.destroy(); // safety on restarts

    // Grid (thin lines, subtle)
    this.gridG = this.scene.add.graphics().setDepth(0);
    this.redrawGrid();

    // Snake & Food layers
    this.snakeLayer = this.scene.add.container(0, 0).setDepth(5);

    this.foodLayer = this.scene.add.container(0, 0).setDepth(4);
    const halo = this.scene.add.circle(0, 0, this.tile * 0.55, 0xff6666, 0.25);
    const dot = this.scene.add.circle(0, 0, this.tile * 0.38, 0xff5555, 1);
    this.foodLayer.add([halo, dot]);

    // Pulse tween for food (yoyo)
    this.foodPulse = this.scene.tweens.add({
      targets: this.foodLayer,
      scale: 1.12,
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: "sine.inout",
    });
  }

  destroy() {
    try { this.foodPulse?.stop(); } catch {}
    try { this.gridG?.destroy(); } catch {}
    try { this.snakeLayer?.destroy(true); } catch {}
    try { this.foodLayer?.destroy(true); } catch {}
    this.gridG = undefined;
    this.snakeLayer = undefined;
    this.foodLayer = undefined;
    this.foodPulse = undefined;
  }

  redrawGrid() {
    if (!this.gridG) return;
    const g = this.gridG;
    g.clear();

    const w = this.grid.cols * this.tile;
    const h = this.grid.rows * this.tile;

    g.lineStyle(1, 0xffffff, 0.06);
    for (let x = 0; x <= this.grid.cols; x++) {
      const px = Math.floor(x * this.tile) + 0.5;
      g.lineBetween(px, 0, px, h);
    }
    for (let y = 0; y <= this.grid.rows; y++) {
      const py = Math.floor(y * this.tile) + 0.5;
      g.lineBetween(0, py, w, py);
    }
  }

  setFood(p: Point) {
    if (!this.foodLayer) return;
    this.foodLayer.setPosition(p.x * this.tile + this.tile / 2, p.y * this.tile + this.tile / 2);
  }

  renderSnake(snake: Point[], headDir: Direction) {
    if (!this.snakeLayer) this.snakeLayer = this.scene.add.container(0, 0).setDepth(5);
    // Clear previous graphics each frame (Snake is small; this is fine & restart-proof)
    this.snakeLayer.removeAll(true);

    const headColor = 0x77ff77;
    const tailColor = 0xdde7dd;

    const lerp = (a: number, b: number, t: number) => (a + (b - a) * t) | 0;
    const mix = (c1: number, c2: number, t: number) => {
      const r1 = (c1 >> 16) & 0xff, g1 = (c1 >> 8) & 0xff, b1 = c1 & 0xff;
      const r2 = (c2 >> 16) & 0xff, g2 = (c2 >> 8) & 0xff, b2 = c2 & 0xff;
      return (lerp(r1, r2, t) << 16) | (lerp(g1, g2, t) << 8) | lerp(b1, b2, t);
    };

    // Draw segments
    for (let i = 0; i < snake.length; i++) {
      const seg = snake[i];
      const t = snake.length <= 1 ? 0 : i / (snake.length - 1);
      const col = i === 0 ? headColor : mix(headColor, tailColor, t);
      const g = this.scene.add.graphics();
      g.fillStyle(col, 1);
      g.fillRoundedRect(seg.x * this.tile, seg.y * this.tile, this.tile, this.tile, Math.min(6, this.tile * 0.3));

      // small outline for readability
      g.lineStyle(1, 0x000000, 0.12);
      g.strokeRoundedRect(seg.x * this.tile, seg.y * this.tile, this.tile, this.tile, Math.min(6, this.tile * 0.3));

      this.snakeLayer.add(g);

      // Eyes on head
      if (i === 0) {
        const eyeOffset = Math.floor(this.tile * 0.18);
        const centerX = seg.x * this.tile + this.tile / 2;
        const centerY = seg.y * this.tile + this.tile / 2;

        let ex1 = 0, ey1 = 0, ex2 = 0, ey2 = 0;
        switch (headDir) {
          case "right":
            ex1 = centerX + eyeOffset; ey1 = centerY - eyeOffset * 0.5;
            ex2 = centerX + eyeOffset; ey2 = centerY + eyeOffset * 0.5;
            break;
          case "left":
            ex1 = centerX - eyeOffset; ey1 = centerY - eyeOffset * 0.5;
            ex2 = centerX - eyeOffset; ey2 = centerY + eyeOffset * 0.5;
            break;
          case "up":
            ex1 = centerX - eyeOffset * 0.5; ey1 = centerY - eyeOffset;
            ex2 = centerX + eyeOffset * 0.5; ey2 = centerY - eyeOffset;
            break;
          case "down":
          default:
            ex1 = centerX - eyeOffset * 0.5; ey1 = centerY + eyeOffset;
            ex2 = centerX + eyeOffset * 0.5; ey2 = centerY + eyeOffset;
            break;
        }
        const eyeR = Math.max(2, Math.floor(this.tile * 0.12));
        const pupilR = Math.max(1, Math.floor(eyeR * 0.55));

        const eyes = this.scene.add.graphics();
        eyes.fillStyle(0xffffff, 1);
        eyes.fillCircle(ex1, ey1, eyeR);
        eyes.fillCircle(ex2, ey2, eyeR);
        eyes.fillStyle(0x222222, 1);
        eyes.fillCircle(ex1, ey1, pupilR);
        eyes.fillCircle(ex2, ey2, pupilR);
        this.snakeLayer.add(eyes);
      }
    }
  }

  playEatFX(head: Point) {
    // subtle camera bump
    try { this.scene.cameras.main.shake(90, 0.002); } catch {}

    // radial ring pop at head
    const ring = this.scene.add.graphics().setDepth(6);
    const cx = head.x * this.tile + this.tile / 2;
    const cy = head.y * this.tile + this.tile / 2;
    ring.lineStyle(2, 0x99ffaa, 0.9);
    ring.strokeCircle(cx, cy, this.tile * 0.4);
    this.scene.tweens.add({
      targets: ring,
      alpha: 0,
      scale: 1.6,
      duration: 180,
      ease: "quad.out",
      onComplete: () => ring.destroy(),
    });
    // optional light vibration
    try { (navigator as any)?.vibrate?.(10); } catch {}
  }
}