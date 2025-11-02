import Phaser from "phaser";
import { BaseMenuScene } from "../framework/scenes/BaseMenuScene";
import { requestFullscreenIfPossible } from "../utils/fullscreen";

export default class SnakeMenuScene extends BaseMenuScene {
  private highText?: Phaser.GameObjects.Text;

  // Keep references so we can clean them up on shutdown
  private hintText?: Phaser.GameObjects.Text;
  private hintTween?: Phaser.Tweens.Tween;

  protected getStartHint(): string {
    return "Tap to Start • Space/Enter";
  }

  public create(): void {
    // Let BaseMenuScene lay out the title + start hint
    super.create();

    // Pulse the start hint (find by name or by matching text)
    const applyHintTween = () => {
      const byName = (this.children.getByName?.("startHint") as Phaser.GameObjects.Text | undefined);
      const byText = this.children.list.find(
        (o) => o instanceof Phaser.GameObjects.Text &&
               (o as Phaser.GameObjects.Text).text === this.getStartHint()
      ) as Phaser.GameObjects.Text | undefined;

      const hint = byName ?? byText;
      if (!hint) return;

      this.hintText = hint;
      hint.setDepth(10);
      try { this.hintTween?.stop(); } catch {}
      this.hintTween = this.tweens.add({
        targets: hint,
        alpha: { from: 1, to: 0.35 },
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    };

    applyHintTween();
    // In case BaseMenuScene adds the hint after our create tick
    this.time.delayedCall(0, applyHintTween);

    // High score footer
    let high = 0;
    try { high = Number(localStorage.getItem("snakeHighScore") || "0"); } catch { high = 0; }

    if (high > 0) {
      this.highText = this.add.text(
        this.scale.width / 2,
        this.scale.height - 28,
        `High: ${high}`,
        this.getTheme().typography.small
      ).setOrigin(0.5, 0.5);

      const onResize = () => {
        this.highText?.setPosition(this.scale.width / 2, this.scale.height - 28);
      };
      this.scale.on("resize", onResize);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.scale.off("resize", onResize);
      });
    }

    // Cleanup
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      try { this.hintTween?.stop(); } catch {}
      this.hintTween = undefined;
      this.hintText = undefined;
    });
  }

  protected startGame() {
    try { requestFullscreenIfPossible(); } catch {}
    this.scene.start("Play");
  }
}