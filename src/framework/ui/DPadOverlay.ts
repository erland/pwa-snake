import Phaser from "phaser";

export type DPadOptions = {
  /** Event names to emit on click/tap; defaults match the existing Snake events. */
  events?: { up?: string; down?: string; left?: string; right?: string };
};

/**
 * Simple on-screen D-pad for touch devices. Emits scene events on presses.
 * Usage:
 *   const dpad = new DPadOverlay(this, { events: { up: "move_up", ... } });
 *   dpad.attach(); // creates and positions
 *   dpad.destroy(); // removes
 */
export class DPadOverlay {
  private scene: Phaser.Scene;
  private opts: Required<DPadOptions>;
  private nodes?: { up: Phaser.GameObjects.Container; down: Phaser.GameObjects.Container;
                    left: Phaser.GameObjects.Container; right: Phaser.GameObjects.Container; };
  private onResize?: () => void;

  constructor(scene: Phaser.Scene, opts: DPadOptions = {}) {
    this.scene = scene;
    this.opts = {
      events: {
        up: opts.events?.up ?? "move_up",
        down: opts.events?.down ?? "move_down",
        left: opts.events?.left ?? "move_left",
        right: opts.events?.right ?? "move_right",
      },
    };
  }

  attach(): void {
    const up = this.makeCircleButton("↑", this.opts.events.up);
    const down = this.makeCircleButton("↓", this.opts.events.down);
    const left = this.makeCircleButton("←", this.opts.events.left);
    const right = this.makeCircleButton("→", this.opts.events.right);
    this.nodes = { up, down, left, right };
    this.position();

    this.onResize = () => this.position();
    this.scene.scale.on("resize", this.onResize);
  }

  private makeCircleButton(label: string, emit: string) {
    const r = 26;
    const g = this.scene.add.graphics();
    g.fillStyle(0xffffff, 0.12).fillCircle(0, 0, r).lineStyle(2, 0xffffff, 0.5).strokeCircle(0, 0, r);
    const t = this.scene.add.text(0, 0, label, { fontFamily: "monospace", fontSize: "18px", color: "#ffffff" }).setOrigin(0.5);
    const c = this.scene.add.container(0, 0, [g, t]).setSize(r * 2, r * 2).setInteractive({ useHandCursor: true });

    const reset = () => g
      .clear()
      .fillStyle(0xffffff, 0.12).fillCircle(0, 0, r)
      .lineStyle(2, 0xffffff, 0.5).strokeCircle(0, 0, r);

    c.on("pointerdown", () => {
      this.scene.events.emit(emit);
      g.clear();
      g.fillStyle(0xffffff, 0.24).fillCircle(0, 0, r).lineStyle(2, 0xffffff, 0.5).strokeCircle(0, 0, r);
      this.scene.time.delayedCall(80, reset);
    });
    c.on("pointerup", reset);
    c.on("pointerout", reset);

    return c;
  }

  private position() {
    if (!this.nodes) return;
    const w = this.scene.scale.width, h = this.scene.scale.height;
    const cs = getComputedStyle(document.documentElement);
    const insetR = parseFloat(cs.getPropertyValue("--safe-right")) || 0;
    const insetB = parseFloat(cs.getPropertyValue("--safe-bottom")) || 0;
    const r = Math.max(18, Math.min(w, h) * 0.07);
    const gap = Math.max(8, r * 0.25);
    const margin = Math.max(8, Math.min(w, h) * 0.04);
    const extent = 2 * r + gap;
    const cx = w - (margin + insetR + extent);
    const cy = h - (margin + insetB + extent);
    this.nodes.up.setPosition(   cx,             cy - (r + gap));
    this.nodes.down.setPosition( cx,             cy + (r + gap));
    this.nodes.left.setPosition( cx - (r + gap), cy);
    this.nodes.right.setPosition(cx + (r + gap), cy);
  }

  destroy(): void {
    if (this.onResize) {
      this.scene.scale.off("resize", this.onResize);
      this.onResize = undefined;
    }
    if (!this.nodes) return;
    try { this.nodes.up.destroy(); } catch {}
    try { this.nodes.down.destroy(); } catch {}
    try { this.nodes.left.destroy(); } catch {}
    try { this.nodes.right.destroy(); } catch {}
    this.nodes = undefined;
  }
}
