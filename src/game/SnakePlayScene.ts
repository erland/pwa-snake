import Phaser from "phaser";
import { BasePlayScene } from "../framework/scenes/BasePlayScene";
import { SnakeInput } from "./SnakeInput";
import * as L from "./logic";
import type { Direction } from "./logic";

export default class SnakePlayScene extends BasePlayScene {
  private state!: L.GameState;
  private nextDir!: Direction;

  // Transform root: scales + centers entire board
  private boardRoot!: Phaser.GameObjects.Container;
  private onResizeCb?: () => void;

  // Fit behavior (tweak if you like)
  private FIT_MODE: "fit" | "cover" = "fit"; // was "fit"
  private USE_INTEGER_ZOOM = false;              // keep pixels crisp

  // Single graphics batch renderer (like digest_working/GameScene)
  private gfx!: Phaser.GameObjects.Graphics;
  private pulse = 0; // food pulse anim (radians)

  // HUD
  private scoreText?: Phaser.GameObjects.Text;
  private highText?: Phaser.GameObjects.Text;
  private highResizeHandler?: () => void;

  private prevScore = 0;
  private rng = new L.MathRandom();

  // D-pad (mobile)
  private showDPad!: boolean;
  private dpad?: {
    up: Phaser.GameObjects.Container;
    down: Phaser.GameObjects.Container;
    left: Phaser.GameObjects.Container;
    right: Phaser.GameObjects.Container;
  };
  private dpadResizeHandler?: () => void;

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
    this.boardRoot = this.add.container(0, 0).setDepth(0);

    // ✅ Reduce sub-pixel shimmer during movement/shake
    this.cameras.main.roundPixels = true;

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

    // Optional on-screen D-pad
    this.showDPad = this.detectTouch();
    try {
      const override = localStorage.getItem("snakeShowDpad");
      if (override === "1") this.showDPad = true;
      if (override === "0") this.showDPad = false;
    } catch {}
    this.destroyDPad();
    if (this.showDPad) this.createDPad();

    // Scale + center now and on resize
    this.updateBoardTransform();
    this.onResizeCb = () => this.updateBoardTransform();
    this.scale.on("resize", this.onResizeCb);

    // Clean up on end of run
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.removeDirectionListeners();
      this.hardReset();
      this.destroyDPad();
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
    this.state = (L as any).advance.length >= 2 ? L.advance(this.state, this.rng) : L.advance(this.state);

    // Animate food pulse
    this.pulse = (this.pulse + 0.18) % (Math.PI * 2);

    // HUD
    this.updateHud(this.state.score);

    // Redraw frame
    this.draw();

    // Eat FX when score increases
    if (this.state.score > this.prevScore) {
      const head = this.state.snake[0];
      this.playEatFX(head);
    }

    if (this.state.isGameOver) {
      this.onGameOver();
    }
  }

  // ===== Drawing (mirrors digest_working look) =====================

  private COLOR_TILE = 0x101010;     // checkerboard dark tile
  private COLOR_FRAME = 0xffffff;    // inner frame
  private COLOR_FOOD  = 0xe91e63;    // magenta
  private COLOR_SNAKE = 0x43a047;    // body
  private COLOR_HEAD  = 0x7cb342;    // head brighter
  private COLOR_EDGE  = 0x1b5e20;    // outline

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
          if (((x + y) & 1) === 0) {
            g.fillRect(x * tile, y * tile, tile, tile);
          }
        }
      }
    }

    // inner white frame
    const border = Math.max(2, Math.floor(tile / 8));
    g.fillStyle(this.COLOR_FRAME, 0.85);
    // top/bottom
    g.fillRect(0, 0, w, border);
    g.fillRect(0, h - border, w, border);
    // left/right
    g.fillRect(0, 0, border, h);
    g.fillRect(w - border, 0, border, h);

    // food (pulsing circle + highlight)
    const f = this.state.food;
    const cx = f.x * tile + tile / 2;
    const cy = f.y * tile + tile / 2;
    const baseR = Math.max(3, Math.floor(tile * 0.33));
    const r = baseR * (1 + 0.06 * Math.sin(this.pulse));
    g.fillStyle(this.COLOR_FOOD, 1).fillCircle(cx, cy, r);
    g.fillStyle(0xffffff, 0.9).fillCircle(cx - r * 0.35, cy - r * 0.35, Math.max(1, Math.floor(r * 0.25)));

    // snake segments (rounded rect + outline), eyes on head
    const outline = Math.max(1, Math.floor(tile * 0.06));
    const radius  = Math.min(6, Math.floor(tile * 0.3));

    for (let i = 0; i < this.state.snake.length; i++) {
      const seg = this.state.snake[i];
      const x = seg.x * tile;
      const y = seg.y * tile;
      const isHead = i === 0;

      // outline under
      g.fillStyle(this.COLOR_EDGE, 0.6).fillRoundedRect(x, y, tile, tile, radius);
      // body fill inset
      g.fillStyle(isHead ? this.COLOR_HEAD : this.COLOR_SNAKE, 1)
       .fillRoundedRect(x + outline, y + outline, tile - 2 * outline, tile - 2 * outline, Math.max(0, radius - outline));

      // eyes on head
      if (isHead && tile >= 8) {
        const eyeR = Math.max(1, Math.floor(tile * 0.08));
        const eyeOffset = Math.max(1, Math.floor(tile * 0.22));
        const front = Math.max(1, Math.floor(tile * 0.28));
        let ex1 = x + tile / 2, ey1 = y + tile / 2;
        let ex2 = ex1,            ey2 = ey1;
        switch (this.state.dir) {
          case "right":
            ex1 = x + tile - front; ey1 = y + eyeOffset;
            ex2 = x + tile - front; ey2 = y + tile - eyeOffset; break;
          case "left":
            ex1 = x + front; ey1 = y + eyeOffset;
            ex2 = x + front; ey2 = y + tile - eyeOffset; break;
          case "up":
            ex1 = x + eyeOffset; ey1 = y + front;
            ex2 = x + tile - eyeOffset; ey2 = y + front; break;
          case "down":
          default:
            ex1 = x + eyeOffset; ey1 = y + tile - front;
            ex2 = x + tile - eyeOffset; ey2 = y + tile - front; break;
        }
        g.fillStyle(0xffffff, 0.95).fillCircle(ex1, ey1, eyeR).fillCircle(ex2, ey2, eyeR);
        g.fillStyle(0x222222, 1).fillCircle(ex1, ey1, Math.max(1, Math.floor(eyeR * 0.6)))
                                 .fillCircle(ex2, ey2, Math.max(1, Math.floor(eyeR * 0.6)));
      }
    }
  }

  private playEatFX(head: L.Point) {
    // Softer shake when fractional zoom to avoid shimmer
    const z = this.boardRoot?.scaleX || 1;
    const fractional = Math.abs(z - Math.round(z)) > 1e-6;
    const shakeAmp = fractional ? 0.0007 : 0.002; // old 0.002
    try { this.cameras.main.shake(80, shakeAmp); } catch {}
  
    // Center of the eaten tile in board coordinates
    const cx = head.x * L.TILE_SIZE + L.TILE_SIZE / 2;
    const cy = head.y * L.TILE_SIZE + L.TILE_SIZE / 2;
  
    // Draw geometry at local (0,0), position the Graphics at (cx, cy)
    const ring = this.add.graphics().setDepth(6);
    this.boardRoot.add(ring);
    ring.setPosition(cx, cy);                // <-- crucial: scale around the circle center
    const r = Math.floor(L.TILE_SIZE * 0.35);
    ring.lineStyle(2, 0x99ffaa, 0.9).strokeCircle(0, 0, r); // draw at local origin
  
    this.tweens.add({
      targets: ring,
      alpha: 0,
      scale: 1.6,
      duration: 180,
      ease: "Quad.easeOut",
      onComplete: () => ring.destroy(),
    });
  
    try { (navigator as any)?.vibrate?.(10); } catch {}
  }

  // ======================================================

  // Keep Score + High in sync (and persist High)
  private updateHud(score: number) {
    this.scoreText?.setText(`Score: ${score}`);

    let high = 0;
    try { high = Number(localStorage.getItem("snakeHighScore") || "0"); } catch {}

    if (score > high) {
      high = score;
      try { localStorage.setItem("snakeHighScore", String(high)); } catch {}
    }
    this.highText?.setText(`High: ${high}`);
  }

  private onGameOver() {
    const finalScore = this.state.score;
    try {
      const prev = Number(localStorage.getItem("snakeHighScore") || "0");
      if (finalScore > prev) localStorage.setItem("snakeHighScore", String(finalScore));
    } catch {}
    this.scene.start("GameOver", { score: finalScore });
  }

  // ----- Cleanup helpers -----

  private hardReset() {
    if (this.onResizeCb) {
      this.scale.off("resize", this.onResizeCb);
      this.onResizeCb = undefined;
    }

    try { this.boardRoot?.destroy(true); } catch {}
    this.boardRoot = undefined as any;

    try { this.gfx?.destroy(); } catch {}
    this.gfx = undefined as any;

    // Clear display list (safe at start of buildWorld)
    this.children.removeAll(true);

    // Destroy HUD refs
    try { this.scoreText?.destroy(); } catch {}
    try { this.highText?.destroy(); } catch {}
    this.scoreText = undefined;
    this.highText = undefined;

    if (this.highResizeHandler) {
      this.scale.off("resize", this.highResizeHandler);
      this.highResizeHandler = undefined;
    }

    // Remove any lingering listeners
    this.removeDirectionListeners();
  }

  private removeDirectionListeners() {
    this.events.removeAllListeners("move_left");
    this.events.removeAllListeners("move_right");
    this.events.removeAllListeners("move_up");
    this.events.removeAllListeners("move_down");
  }

  // ----- Scale/center helpers -----

  private getBoardPixelSize() {
    const { cols, rows } = this.state.grid;
    const tile = L.TILE_SIZE;
    return { w: cols * tile, h: rows * tile };
  }

  private updateBoardTransform() {
    const { w, h } = this.getBoardPixelSize();
    const isResize = this.scale.mode === Phaser.Scale.RESIZE;
    const sw = isResize ? this.scale.width  : (this.scale as any).displaySize?.width  ?? this.scale.width;
    const sh = isResize ? this.scale.height : (this.scale as any).displaySize?.height ?? this.scale.height;


    // Base zoom ratio
    let z = this.FIT_MODE === "cover"
      ? Math.max(sw / w, sh / h)   // fill screen, may crop
      : Math.min(sw / w, sh / h);  // letterbox

    // Snap only when upscaling; allow fractional downscale on tiny screens
    if (this.USE_INTEGER_ZOOM && z >= 1) {
      z = this.FIT_MODE === "cover" ? Math.ceil(z) : Math.floor(z);
      if (z < 1) z = 1;
    }

    const ox = Math.floor((sw - w * z) / 2);
    const oy = Math.floor((sh - h * z) / 2);

    this.boardRoot.setScale(z);
    this.boardRoot.setPosition(ox, oy);
  }

  // ----- D-Pad helpers -----

  private detectTouch(): boolean {
    const phaserTouch = !!this.sys?.game?.device?.input?.touch;
    const coarse = !!window.matchMedia?.("(pointer: coarse)").matches;
    const maxPoints = (navigator as any)?.maxTouchPoints ?? 0;
    const ontouch = "ontouchstart" in window;
    return Boolean(phaserTouch || coarse || ontouch || maxPoints > 0);
  }

  private makeCircleButton(label: string, emit: string) {
    const r = 26;
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.12).fillCircle(0, 0, r).lineStyle(2, 0xffffff, 0.5).strokeCircle(0, 0, r);
    const t = this.add.text(0, 0, label, { fontFamily: "monospace", fontSize: "18px", color: "#ffffff" }).setOrigin(0.5);
    const c = this.add.container(0, 0, [g, t]).setSize(r * 2, r * 2).setInteractive({ useHandCursor: true });

    const reset = () => g
      .clear()
      .fillStyle(0xffffff, 0.12).fillCircle(0, 0, r)
      .lineStyle(2, 0xffffff, 0.5).strokeCircle(0, 0, r);

    c.on("pointerdown", () => {
      this.events.emit(emit);
      g.clear();
      g.fillStyle(0xffffff, 0.24).fillCircle(0, 0, r).lineStyle(2, 0xffffff, 0.5).strokeCircle(0, 0, r);
      this.time.delayedCall(80, reset);
    });
    c.on("pointerup", reset);
    c.on("pointerout", reset);

    return c;
  }

  private createDPad() {
    const up = this.makeCircleButton("↑", "move_up");
    const down = this.makeCircleButton("↓", "move_down");
    const left = this.makeCircleButton("←", "move_left");
    const right = this.makeCircleButton("→", "move_right");
    this.dpad = { up, down, left, right };
    this.positionDPad();

    this.dpadResizeHandler = () => this.positionDPad();
    this.scale.on("resize", this.dpadResizeHandler);
  }

  private positionDPad() {
    if (!this.dpad) return;
    const w = this.scale.width, h = this.scale.height;
    const cs = getComputedStyle(document.documentElement);
    const insetR = parseFloat(cs.getPropertyValue("--safe-right")) || 0;
    const insetB = parseFloat(cs.getPropertyValue("--safe-bottom")) || 0;
    const r = Math.max(18, Math.min(w, h) * 0.07);
    const gap = Math.max(8, r * 0.25);
    const margin = Math.max(8, Math.min(w, h) * 0.04);
    const extent = 2 * r + gap;
    const cx = w - (margin + insetR + extent);
    const cy = h - (margin + insetB + extent);
    this.dpad.up.setPosition(   cx,             cy - (r + gap));
    this.dpad.down.setPosition( cx,             cy + (r + gap));
    this.dpad.left.setPosition( cx - (r + gap), cy);
    this.dpad.right.setPosition(cx + (r + gap), cy);
  }

  private destroyDPad() {
    if (this.dpadResizeHandler) {
      this.scale.off("resize", this.dpadResizeHandler);
      this.dpadResizeHandler = undefined;
    }
    if (!this.dpad) return;
    try { this.dpad.up.destroy(); } catch {}
    try { this.dpad.down.destroy(); } catch {}
    try { this.dpad.left.destroy(); } catch {}
    try { this.dpad.right.destroy(); } catch {}
    this.dpad = undefined;
  }
}