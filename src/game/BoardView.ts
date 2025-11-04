import Phaser from "phaser";
import { BoardFitter } from "../framework";
import { SnakeRenderer, type SnakeRendererOptions } from "./SnakeRenderer";
import * as L from "./logic";

export type BoardViewOptions = {
  tileSize: number;
  palette?: SnakeRendererOptions["palette"];
  fitMode?: "fit" | "cover";
  integerZoom?: boolean;
};

/**
 * BoardView owns the renderable board container, BoardFitter, and SnakeRenderer.
 * It exposes `root` (container), `resize()`, `draw(...)`, and `destroy()`.
 */
export class BoardView {
  readonly root: Phaser.GameObjects.Container;
  private fitter: BoardFitter;
  private renderer: SnakeRenderer;
  private scene: Phaser.Scene;
  private getBoardPx: () => { w: number; h: number };

  constructor(scene: Phaser.Scene, getBoardPixelSize: () => { w: number; h: number }, opts: BoardViewOptions) {
    this.scene = scene;
    this.getBoardPx = getBoardPixelSize;
    this.root = scene.add.container(0, 0);
    this.fitter = new BoardFitter(
      scene,
      this.root,
      () => this.getBoardPx(),
      { fitMode: opts.fitMode ?? "fit", integerZoom: opts.integerZoom ?? false }
    );
    this.renderer = new SnakeRenderer(scene, this.root, { tileSize: opts.tileSize, palette: opts.palette });
    this.fitter.attach();
  }

  resize(): void {
    this.fitter.layout();
  }

  draw(state: L.GameState, pulse: number): void {
    this.renderer.draw(state, pulse);
  }

  destroy(): void {
    try { this.fitter.destroy(); } catch {}
    try { this.renderer.destroy?.(); } catch {}
    try { this.root.destroy(true); } catch {}
    // Note: SnakeRenderer.destroy cleans its Graphics; container is owned here.
  }
}