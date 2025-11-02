import Phaser from "phaser";
import { BaseGameOverScene } from "../framework/scenes/BaseGameOverScene";

export default class SnakeGameOverScene extends BaseGameOverScene {
  constructor() { super(); }

  public override create(data?: { score?: number }) {
    super.create(); // lays out title + default hint

    const score = Math.max(0, Number(data?.score ?? 0));

    // Read/update high score
    let high = 0;
    try { high = Number(localStorage.getItem("snakeHighScore") || "0"); } catch { high = 0; }
    if (score > high) {
      high = score;
      try { localStorage.setItem("snakeHighScore", String(high)); } catch {}
    }

    const theme = this.getTheme();
    const cx = this.scale.width / 2;
    const h = this.scale.height;

    // Show both score and high score (stacked)
    this.add.text(cx, h * 0.50, `Score: ${score}`, theme.typography.medium).setOrigin(0.5);
    this.add.text(cx, h * 0.56, `High:  ${high}`,  theme.typography.medium).setOrigin(0.5);

    // Nudge the base hint down a bit so it doesn't collide with the scores
    const hint = this.children.getByName("gameOverHint") as Phaser.GameObjects.Text | undefined;
    if (hint) hint.setY(h * 0.64);
  }

  protected override getNextSceneKey(): string {
    return this.getSceneKeys().menu;
  }
}