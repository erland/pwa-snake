import Phaser from "phaser";

/**
 * Minimal HUD for score + high score with responsive right-anchor.
 */
export class PlayHud {
  private scene: Phaser.Scene;
  private scoreText?: Phaser.GameObjects.Text;
  private highText?: Phaser.GameObjects.Text;
  private onResize?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  init(initialHigh: number): void {
    this.scoreText = this.scene.add
      .text(8, 6, "Score: 0", { fontFamily: "monospace", fontSize: "14px", color: "#ffffff" })
      .setOrigin(0, 0)
      .setDepth(10);

    this.highText = this.scene.add
      .text(this.scene.scale.width - 8, 6, `High: ${initialHigh}`, { fontFamily: "monospace", fontSize: "14px", color: "#ffffff" })
      .setOrigin(1, 0)
      .setDepth(10);

    const resize = () => this.highText?.setPosition(this.scene.scale.width - 8, 6);
    this.onResize = resize;
    this.scene.scale.on("resize", resize);
  }

  updateScore(score: number): void {
    if (!this.scoreText) return;
    this.scoreText.setText(`Score: ${score}`);
  }

  destroy(): void {
    if (this.onResize) {
      this.scene.scale.off("resize", this.onResize);
      this.onResize = undefined;
    }
    try { this.scoreText?.destroy(); } catch {}
    try { this.highText?.destroy(); } catch {}
    this.scoreText = undefined;
    this.highText = undefined;
  }
}
