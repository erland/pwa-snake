import { BaseMenuScene } from "../framework/scenes/BaseMenuScene";
import { BaseTheme } from "../framework/ui/BaseTheme";
import { requestFullscreenIfPossible } from "../utils/fullscreen";

class SnakeTheme extends BaseTheme {
  getTitle(): string { return "S N A K E"; }

  textStyleLarge()  { return { fontFamily: "monospace", fontSize: "36px", color: "#ffffff", align: "center" } as const; }
  textStyleMedium() { return { fontFamily: "monospace", fontSize: "18px", color: "#ffffff", align: "center" } as const; }
  textStyleSmall()  { return { fontFamily: "monospace", fontSize: "16px", color: "#ffffff", align: "center" } as const; }
}

export default class SnakeMenuScene extends BaseMenuScene {
  private highText?: Phaser.GameObjects.Text;

  // NEW: keep references to hint + tween so we can manage them safely
  private hintText?: Phaser.GameObjects.Text;
  private hintTween?: Phaser.Tweens.Tween;

  constructor() { super(new SnakeTheme()); }

  protected getStartHint(): string {
    return "Tap to Start • Space/Enter";
  }

  public create(): void {
    super.create();

    // --- Restore pulsing hint like in digest_working ---
    const applyHintTween = () => {
      // Try to get by name first (if BaseMenuScene names it), else by matching text
      const byName = (this.children.getByName?.("startHint") as Phaser.GameObjects.Text | undefined);
      const byText = this.children.list.find(
        (o) => o instanceof Phaser.GameObjects.Text && (o as Phaser.GameObjects.Text).text === this.getStartHint()
      ) as Phaser.GameObjects.Text | undefined;

      const hint = byName ?? byText;
      if (!hint) return;

      this.hintText = hint;
      hint.setDepth(10); // keep above any background
      // Stop any previous tween (scene re-entry)
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

    // Apply immediately…
    applyHintTween();
    // …and once more next tick in case BaseMenuScene lays out after create()
    this.time.delayedCall(0, applyHintTween);

    // --- High score footer (unchanged) ---
    let high = 0;
    try { high = Number(localStorage.getItem("snakeHighScore") || "0"); } catch { high = 0; }

    if (high > 0) {
      this.highText = this.add.text(
        this.scale.width / 2,
        this.scale.height - 28,
        `High: ${high}`,
        this.theme.textStyleSmall()
      ).setOrigin(0.5, 0.5);

      const onResize = () => {
        this.highText?.setPosition(this.scale.width / 2, this.scale.height - 28);
      };

      this.scale.on("resize", onResize);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.scale.off("resize", onResize);
      });
    }

    // Clean up hint tween on shutdown to avoid leaks
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