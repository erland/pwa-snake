import Phaser from "phaser";
import { BaseGameOverScene } from "@erlandlindmark/pwa-game-2d-framework";

/**
 * Snake-specific Game Over scene:
 * - Shows both Score and High score
 * - Nudges base hint downward so it doesn't collide with the scores
 * - Returns to the Menu on retry (instead of re-starting Play directly)
 */
export default class SnakeGameOverScene extends BaseGameOverScene {
  private scoreText?: Phaser.GameObjects.Text;
  private highText?: Phaser.GameObjects.Text;

  /** We want to go back to the menu on retry. */
  protected override getNextSceneKey(): string {
    return this.getSceneKeys().menu;
  }

  /** Localize/customize if you like. */
  protected override getRetryHint(): string {
    return "Tap / Press Enter to go to Menu";
  }

  /** Add game-specific UI without overriding create(). */
  protected override afterCreate(data?: { score?: number }): void {
    const theme = this.getTheme();
    const cx = this.scale.width * 0.5;
    const h = this.scale.height;

    const score = Math.max(0, Number(data?.score ?? 0));

    // Read/update high score (best-effort).
    let high = 0;
    try { high = Number(localStorage.getItem("snakeHighScore") || "0") || 0; } catch { high = 0; }
    if (score > high) {
      high = score;
      try { localStorage.setItem("snakeHighScore", String(high)); } catch {}
    }

    // Render
    this.scoreText = this.add.text(cx, h * 0.48, `Score: ${score}`, theme.typography.medium).setOrigin(0.5);
    this.highText  = this.add.text(cx, h * 0.54, `High:  ${high}`,  theme.typography.medium).setOrigin(0.5);

    // Nudge base hint down a bit so it doesn't collide with the scores
    const hint = this.children.getByName("gameOverHint") as Phaser.GameObjects.Text | undefined;
    if (hint) hint.setY(h * 0.64);

    // Keep positions nice on resize
    const onResize = () => {
      const cx2 = this.scale.width * 0.5;
      const h2 = this.scale.height;
      this.scoreText?.setPosition(cx2, h2 * 0.48);
      this.highText?.setPosition(cx2,  h2 * 0.54);
      const hint2 = this.children.getByName("gameOverHint") as Phaser.GameObjects.Text | undefined;
      if (hint2) hint2.setY(h2 * 0.64);
    };
    this.scale.on("resize", onResize);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", onResize);
      this.scoreText = undefined;
      this.highText = undefined;
    });
  }
}