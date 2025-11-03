import Phaser from "phaser";

export type BoardFitterOptions = {
  fitMode?: "fit" | "cover";   // fit = letterbox, cover = fill screen (may crop)
  integerZoom?: boolean;       // snap scale to integer factors when >= 1
};

/**
 * BoardFitter centralizes the common "scale+center a board" math for 2D games.
 * It reads the desired board pixel size on-demand via getSize(), and updates
 * the provided root container's position+scale on create and on resize.
 */
export class BoardFitter {
  private scene: Phaser.Scene;
  private root: Phaser.GameObjects.Container;
  private getSize: () => { w: number; h: number };
  private opts: Required<BoardFitterOptions>;
  private onResize?: () => void;

  constructor(scene: Phaser.Scene,
              root: Phaser.GameObjects.Container,
              getSize: () => { w: number; h: number },
              opts: BoardFitterOptions = {}) {
    this.scene = scene;
    this.root = root;
    this.getSize = getSize;
    this.opts = {
      fitMode: opts.fitMode ?? "fit",
      integerZoom: opts.integerZoom ?? false,
    };
  }

  /** Call after constructing; hooks resize and applies initial transform. */
  attach(): void {
    this.update();
    this.onResize = () => this.update();
    this.scene.scale.on("resize", this.onResize);
    // Also respond to browser zoom/layout changes that Phaser may not emit for:
    // re-apply transform next tick to be safe.
    this.scene.events.once(Phaser.Scenes.Events.RESUME, () => this.update());
  }

  /** Remove listeners. */
  detach(): void {
    if (this.onResize) {
      this.scene.scale.off("resize", this.onResize);
      this.onResize = undefined;
    }
  }

  /** Compute and apply the transform to root. */
  update(): void {
    const { w, h } = this.getSize();
    const scaleManager = this.scene.scale as any;
    const mode = scaleManager.mode ?? Phaser.Scale.RESIZE;
    const sw = mode === Phaser.Scale.RESIZE ? scaleManager.width  : (scaleManager.displaySize?.width  ?? scaleManager.width);
    const sh = mode === Phaser.Scale.RESIZE ? scaleManager.height : (scaleManager.displaySize?.height ?? scaleManager.height);

    let z = this.opts.fitMode === "cover"
      ? Math.max(sw / w, sh / h)
      : Math.min(sw / w, sh / h);

    if (this.opts.integerZoom && z >= 1) {
      z = this.opts.fitMode === "cover" ? Math.ceil(z) : Math.floor(z);
      if (z < 1) z = 1;
    }

    const ox = Math.floor((sw - w * z) / 2);
    const oy = Math.floor((sh - h * z) / 2);
    this.root.setScale(z);
    this.root.setPosition(ox, oy);
  }

  /** Shorthand for detach() */
  destroy(): void { this.detach(); }
}
