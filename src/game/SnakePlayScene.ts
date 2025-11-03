import Phaser from "phaser";
import { BasePlayScene } from "../framework";
import { SnakeInput } from "./SnakeInput";
import * as L from "./logic";
import type { Direction } from "./logic";
import { BoardFitter } from "../framework";
import { DPadOverlay } from "../framework";
import { SnakeRenderer } from "./SnakeRenderer";
import { PlayHud } from "./PlayHud";

export default class SnakePlayScene extends BasePlayScene {
  private state!: L.GameState;
  private nextDir!: Direction;

  // Board transform root + helpers
  private boardRoot!: Phaser.GameObjects.Container;
  private fitter?: BoardFitter;

  // Renderer
  private snakeRenderer?: SnakeRenderer;
  private pulse = 0; // food pulse anim

  // HUD
  private hud?: PlayHud;
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

    // RNG-based initial food
    this.state.food = L.placeFood(this.state.snake, this.state.grid, this.rng);

    // Root that we scale + center (board space starts at 0,0)
    this.boardRoot = this.add.container(0, 0);

    // HUD
    let high = 0;
    try { high = Number(localStorage.getItem("snakeHighScore") || "0"); } catch {}
    this.hud = new PlayHud(this);
    this.hud.init(high);

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

    // Renderer
    this.snakeRenderer = new SnakeRenderer(this, this.boardRoot);

    // Clean up on end of run
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.removeDirectionListeners();
      this.hardReset();
      try { this.fitter?.destroy(); } catch {}
      this.fitter = undefined;
      try { this.dpad?.destroy(); } catch {}
      this.dpad = undefined;
      try { this.snakeRenderer?.destroy(); } catch {}
      this.snakeRenderer = undefined;
      try { this.hud?.destroy(); } catch {}
      this.hud = undefined;
    });

    // Initial draw
    this.snakeRenderer.draw(this.state, this.pulse);
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
    this.hud?.updateScore(this.state.score);

    // Redraw frame
    this.snakeRenderer?.draw(this.state, this.pulse);

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

  private onGameOver() {
    const finalScore = this.state.score;
    try {
      const prev = Number(localStorage.getItem("snakeHighScore") || "0");
      if (finalScore > prev) localStorage.setItem("snakeHighScore", String(finalScore));
    } catch {}
    this.scene.start("GameOver", { score: finalScore });
  }

  private hardReset() {
    if (this.boardRoot) {
      try { this.boardRoot.destroy(true); } catch {}
      this.boardRoot = undefined as any;
    }
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

  // ----------------------------- Utilities ------------------------------

  private detectTouch(): boolean {
    // Use Navigator properties if available; otherwise match media.
    try {
      if ("maxTouchPoints" in navigator && (navigator as any).maxTouchPoints > 0) return true;
      if ("msMaxTouchPoints" in navigator && (navigator as any).msMaxTouchPoints > 0) return true;
    } catch {}
    try {
      return (typeof window.matchMedia === "function" && matchMedia("(pointer: coarse)").matches);
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
