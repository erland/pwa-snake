import Phaser from "phaser";
import { BasePlayScene } from "../framework/scenes/BasePlayScene";
import { SnakeInput } from "./SnakeInput";
import * as L from "./logic";
import type { Direction } from "./logic";
import { BoardFitter } from "../framework/scene-helpers/BoardFitter";
import { DPadOverlay } from "../framework/ui/DPadOverlay";

export default class SnakePlayScene extends BasePlayScene {
  private state!: L.GameState;
  private nextDir!: Direction;

  // Board transform root + helpers
  private boardRoot!: Phaser.GameObjects.Container;
  private fitter?: BoardFitter;

  // Renderer
  private gfx!: Phaser.GameObjects.Graphics;
  private pulse = 0; // food pulse anim

  // HUD
  private scoreText?: Phaser.GameObjects.Text;
  private highText?: Phaser.GameObjects.Text;
  private highResizeHandler?: () => void;

  private prevScore = 0;
  private rng = new L.MathRandom();

  // D-pad
  private showDPad!: boolean;
  private dpad?: DPadOverlay;

  constructor() {
    super({ hz: Math.max(1, Math.floor(1000 / (L.TICK_MS ?? 100))), maxCatchUp: 5 });
  }

  protected createInput() {
    // @ts-expect-error - ctor accepts options; importing the type is optional here
    return new SnakeInput(this, { swipeMinDistance: 12, throttleMs: 60 });
  }

  protected buildWorld(): void {
    // Hard reset for restarts
    this.hardReset();

    // Fresh state
    this.state = L.createInitialState();
    this.nextDir = this.state.dir;

    // RNG-based initial food (parity with original)
    this.state.food = L.placeFood(this.state.snake, this.state.grid, this.rng);

    // Root that we scale + center (board space starts at 0,0)
    this.boardRoot = this.add.container(0, 0);
    // Batch graphics renderer lives under boardRoot
    this.gfx = this.add.graphics();
    this.boardRoot.add(this.gfx);

    // HUD
    this.scoreText = this.add
      .text(8, 6, "Score: 0", { fontFamily: "monospace", fontSize: "14px", color: "#ffffff" })
      .setOrigin(0, 0)
      .setDepth(10);

    let high = 0;
    try { high = Number(localStorage.getItem("snakeHighScore") || "0"); } catch {}
    this.highText = this.add
      .text(this.scale.width - 8, 6, `High: ${high}`, { fontFamily: "monospace", fontSize: "14px", color: "#ffffff" })
      .setOrigin(1, 0)
      .setDepth(10);

    this.highResizeHandler = () => {
      this.highText?.setPosition(this.scale.width - 8, 6);
    };
    this.scale.on("resize", this.highResizeHandler);

    // Input mapping (attach once per run)
    this.events.on("move_left",  () => this.queue("left"));
    this.events.on("move_right", () => this.queue("right"));
    this.events.on("move_up",    () => this.queue("up"));
    this.events.on("move_down",  () => this.queue("down"));

    // Optional on-screen D-pad (touch detection with override)
    this.showDPad = this.detectTouch();
    try {
      const override = localStorage.getItem("snakeShowDpad");
      if (override === "1") this.showDPad = true;
      if (override === "0") this.showDPad = false;
    } catch {}
    if (this.showDPad) {
      this.dpad = new DPadOverlay(this, {
        events: { up: "move_up", down: "move_down", left: "move_left", right: "move_right" },
      });
      this.dpad.attach();
    }

    // Centralized scale+center helper
    this.fitter = new BoardFitter(
      this,
      this.boardRoot,
      () => this.getBoardPixelSize(),
      { fitMode: "fit", integerZoom: false }
    );
    this.fitter.attach();

    // Clean up on end of run
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.removeDirectionListeners();
      this.hardReset();
      try { this.fitter?.destroy(); } catch {}
      this.fitter = undefined;
      try { this.dpad?.destroy(); } catch {}
      this.dpad = undefined;
      if (this.highResizeHandler) {
        this.scale.off("resize", this.highResizeHandler);
        this.highResizeHandler = undefined;
      }
    });

    // Initial draw
    this.draw();
  }

  private queue(next: Direction) {
    if (!L.isOpposite(next, this.state.dir)) this.nextDir = next;
  }

  protected tick(_: number): void {
    // Remember previous score to detect eat events
    this.prevScore = this.state.score;

    // Apply queued direction then advance pure logic with RNG
    this.state.pendingDir = this.nextDir;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.state = (L as any).advance(this.state, this.rng);

    // Game over?
    if (this.state.isGameOver) {
      this.onGameOver();
      return;
    }
  }

  protected frame(deltaMs: number): void {
    // Pulse anim for food
    this.pulse += deltaMs * 0.02;

    // HUD
    this.updateHud(this.state.score);

    // Redraw frame
    this.draw();

    // Eat FX when score increases
    if (this.state.score > this.prevScore) {
      const head = this.state.snake[0];
      this.playEatFX(head);
    }
  }

  private getBoardPixelSize() {
    const { cols, rows } = this.state.grid;
    const tile = L.TILE_SIZE;
    return { w: cols * tile, h: rows * tile };
  }

  private updateHud(score: number) {
    if (!this.scoreText) return;
    if (score !== this.prevScore) {
      this.scoreText.setText(`Score: ${score}`);
    }
  }

  private onGameOver() {
    const finalScore = this.state.score;
    try {
      const prev = Number(localStorage.getItem("snakeHighScore") || "0");
      if (finalScore > prev) localStorage.setItem("snakeHighScore", String(finalScore));
    } catch {}
    this.scene.start("GameOver", { score: finalScore });
  }

  private hardReset() {
    try { this.scoreText?.destroy(); } catch {}
    try { this.highText?.destroy(); } catch {}
    this.scoreText = undefined;
    this.highText = undefined;

    if (this.boardRoot) {
      try { this.boardRoot.destroy(true); } catch {}
      this.boardRoot = undefined as any;
    }

    try { this.gfx?.destroy(); } catch {}
    this.gfx = undefined as any;

    // Clear display list (safe at start of buildWorld)
    try { this.children.removeAll(); } catch {}
  }

  private playEatFX(head: L.Point) {
    const tile = L.TILE_SIZE;
    const x = head.x * tile + tile / 2;
    const y = head.y * tile + tile / 2;

    const circ = this.add.circle(x, y, Math.max(3, Math.floor(tile * 0.15)), 0xffffff, 0.85);
    this.boardRoot.add(circ);
    this.tweens.add({
      targets: circ,
      scale: { from: 1, to: 1.8 },
      alpha: { from: 0.85, to: 0 },
      duration: 160,
      ease: "Cubic.easeOut",
      onComplete: () => circ.destroy(),
    });
  }

  // ----------------------------- Rendering ------------------------------

  private COLOR_BG    = 0x0b0b12;
  private COLOR_BDARK = 0x16203a;    // checkerboard dark
  private COLOR_BLITE = 0x1b2748;    // checkerboard light
  private COLOR_FRAME = 0x1c1c29;    // frame
  private COLOR_TILE  = 0xffffff;    // checker alpha
  private COLOR_FOOD  = 0xffe082;    // apple-ish
  private COLOR_EDGE  = 0x1b5e20;    // outline
  private COLOR_SNAKE = 0x43a047;    // body fill
  private COLOR_HEAD  = 0xa5d6a7;    // head highlight

  private draw() {
    const g = this.gfx;
    const tile = L.TILE_SIZE;
    const { cols, rows } = this.state.grid;
    const { w, h } = this.getBoardPixelSize();

    g.clear();
    // NOTE: position/scale are handled by boardRoot; draw at board coordinates

    // background is handled by canvas bg; draw checkerboard
    if (tile >= 6) {
      g.fillStyle(this.COLOR_TILE, 0.45);
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

    // food (pulsing circle + highlight)
    const f = this.state.food;
    const cx = f.x * tile + tile / 2;
    const cy = f.y * tile + tile / 2;
    const baseR = Math.max(3, Math.floor(tile * 0.33));
    const r = baseR * (1 + 0.06 * Math.sin(this.pulse));
    g.fillStyle(this.COLOR_FOOD, 1).fillCircle(cx, cy, r);

    // snake segments
    const outline = Math.max(1, Math.floor(tile * 0.10));
    const headRadius = Math.max(0, Math.floor(tile * 0.22));
    for (let i = 0; i < this.state.snake.length; i++) {
      const s = this.state.snake[i];
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
        switch (this.state.dir) {
          case "right": ex1 += front; ex2 += front; ey1 -= eyeOffset; ey2 += eyeOffset; break;
          case "left":  ex1 -= front; ex2 -= front; ey1 -= eyeOffset; ey2 += eyeOffset; break;
          case "up":    ey1 -= front; ey2 -= front; ex1 -= eyeOffset; ex2 += eyeOffset; break;
          case "down":  ey1 += front; ey2 += front; ex1 -= eyeOffset; ex2 += eyeOffset; break;
        }
        g.fillStyle(0x111318, 1).fillCircle(ex1, ey1, eyeR).fillCircle(ex2, ey2, eyeR);
      }
    }
  }

  // ----------------------------- Utilities ------------------------------

  private detectTouch(): boolean {
    // Use Navigator properties if available; otherwise match media.
    try {
      if ("maxTouchPoints" in navigator && (navigator as any).maxTouchPoints > 0) return true;
      if ("msMaxTouchPoints" in navigator && (navigator as any).msMaxTouchPoints > 0) return true;
    } catch {}
    try {
      return window.matchMedia && matchMedia("(pointer: coarse)").matches;
    } catch {}
    return false;
  }

  private removeDirectionListeners() {
    this.events.removeListener("move_left");
    this.events.removeListener("move_right");
    this.events.removeListener("move_up");
    this.events.removeListener("move_down");
  }
}
