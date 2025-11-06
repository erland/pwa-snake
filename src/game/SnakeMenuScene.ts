import Phaser from "phaser";
import { BaseMenuScene } from "@erlandlindmark/pwa-game-2d-framework";

export default class SnakeMenuScene extends BaseMenuScene {
  private highText?: Phaser.GameObjects.Text;

  protected getStartHint(): string {
    return "Tap to Start • Space/Enter";
  }

  /** Add game-specific UI (high score) */
  protected override afterCreate(): void {
    // Read high score (best-effort).
    let high = 0;
    try { high = Number(localStorage.getItem("snakeHighScore") || "0") || 0; } catch {}

    if (high > 0) {
      const theme = this.getTheme();
      const cx = this.scale.width * 0.5;
      const cy = this.scale.height * 0.58;

      this.highText = this.add
        .text(cx, cy, `High score: ${high}`, theme.typography.medium)
        .setOrigin(0.5, 0.5);

      const onResize = () => this.highText?.setPosition(this.scale.width * 0.5, this.scale.height * 0.58);
      this.scale.on("resize", onResize);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.scale.off("resize", onResize);
        this.highText = undefined;
      });
    }
  }
}
