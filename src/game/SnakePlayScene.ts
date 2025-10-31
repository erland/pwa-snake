import { BasePlayScene } from "../framework/scenes/BasePlayScene";
import { SnakeInput } from "./SnakeInput";
import * as L from "./logic";
import type { Direction } from "./logic";

export default class SnakePlayScene extends BasePlayScene {
  private state!: L.GameState;
  private nextDir!: Direction;

  // Rendering layers
  private snakeLayer?: Phaser.GameObjects.Container;
  private foodSprite?: Phaser.GameObjects.Rectangle;
  private scoreText?: Phaser.GameObjects.Text;

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

    // HUD
    this.scoreText = this.add
      .text(8, 8, "Score: 0", { fontFamily: "system-ui, sans-serif", fontSize: "16px" })
      .setOrigin(0, 0)
      .setDepth(10);

    // Input mapping (attach once per run)
    this.events.on("move_left",  () => this.queue("left"));
    this.events.on("move_right", () => this.queue("right"));
    this.events.on("move_up",    () => this.queue("up"));
    this.events.on("move_down",  () => this.queue("down"));

    // Layers
    this.snakeLayer = this.add.container(0, 0);
    this.foodSprite = this.add.rectangle(0, 0, L.TILE_SIZE, L.TILE_SIZE, 0xff5555).setOrigin(0);

    // Initial draw
    this.syncFood();
    this.renderSnake();

    // Optional on-screen D-pad
    this.showDPad = this.detectTouch();
    try {
      const override = localStorage.getItem("snakeShowDpad");
      if (override === "1") this.showDPad = true;
      if (override === "0") this.showDPad = false;
    } catch {}
    this.destroyDPad();
    if (this.showDPad) this.createDPad();

    // Clean up on end of run
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.removeDirectionListeners();
      this.hardReset();
      this.destroyDPad();
    });
  }

  private queue(next: Direction) {
    if (!L.isOpposite(next, this.state.dir)) this.nextDir = next;
  }

  protected tick(_: number): void {
    // Apply queued direction then advance pure logic with RNG
    this.state.pendingDir = this.nextDir;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.state = (L as any).advance.length >= 2 ? L.advance(this.state, this.rng) : L.advance(this.state);

    this.scoreText?.setText(`Score: ${this.state.score}`);

    this.syncFood();
    this.renderSnake();

    if (this.state.isGameOver) {
      this.onGameOver();
    }
  }

  private syncFood() {
    if (!this.foodSprite) return;
    const f = this.state.food;
    this.foodSprite.setPosition(f.x * L.TILE_SIZE, f.y * L.TILE_SIZE);
  }

  private renderSnake() {
    // Rebuild visuals every frame (bulletproof for restarts; perf is fine for Snake)
    if (!this.snakeLayer) this.snakeLayer = this.add.container(0, 0);
    this.snakeLayer.removeAll(true); // destroy previous segments

    const snake = this.state.snake;
    for (let i = 0; i < snake.length; i++) {
      const seg = snake[i];
      const color = i === 0 ? 0x77ff77 : 0xffffff;
      const r = this.add.rectangle(seg.x * L.TILE_SIZE, seg.y * L.TILE_SIZE, L.TILE_SIZE, L.TILE_SIZE, color)
        .setOrigin(0);
      this.snakeLayer.add(r);
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

  // ----- Cleanup helpers -----

  private hardReset() {
    // Clear display list (safe at start of buildWorld)
    this.children.removeAll(true);

    // Destroy layers/UI refs
    try { this.snakeLayer?.destroy(true); } catch {}
    try { this.foodSprite?.destroy(); } catch {}
    try { this.scoreText?.destroy(); } catch {}
    this.snakeLayer = undefined;
    this.foodSprite = undefined;
    this.scoreText = undefined;

    // Remove any lingering listeners
    this.removeDirectionListeners();
  }

  private removeDirectionListeners() {
    this.events.removeAllListeners("move_left");
    this.events.removeAllListeners("move_right");
    this.events.removeAllListeners("move_up");
    this.events.removeAllListeners("move_down");
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
    c.on("pointerdown", () => this.events.emit(emit));
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