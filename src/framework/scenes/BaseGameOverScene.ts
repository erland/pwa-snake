import Phaser from "phaser";
import { defaultSceneKeys, type SceneKeys } from "./sceneKeys";
import { defaultTheme } from "../ui/defaultTheme";
import type { Theme } from "../ui/Theme";
import type { GameServices } from "../core/types";

/**
 * Generic Game Over scene:
 * - Uses theme tokens for typography
 * - Uses sceneKeys to determine where to go on retry (default: play)
 * - Shows a centered "Game Over" title and hint text
 */
export abstract class BaseGameOverScene extends Phaser.Scene {
  constructor() { super("GameOver"); }
  private hintTween?: Phaser.Tweens.Tween;

  protected getSceneKeys(): SceneKeys {
    const services = this.game.registry.get("services") as GameServices | undefined;
    return services?.sceneKeys ?? defaultSceneKeys;
  }

  protected getTheme(): Theme {
    const services = this.game.registry.get("services") as GameServices | undefined;
    return services?.theme ?? defaultTheme;
  }

  /** Override to customize the heading */
  protected getTitle(): string {
    return "Game Over";
  }

  /** Override to customize the hint */
  protected getHint(): string {
    return "Tap / Press Enter to Retry";
  }

  /** Override to customize restart target (menu vs play) */
  protected getNextSceneKey(): string {
    return this.getSceneKeys().menu; 
  }

  create(): void {
    const { width, height } = this.scale;

    this.buildBackground?.();

    // Title
    this.add
      .text(width / 2, height * 0.38, this.getTitle(), this.getTheme().typography.large)
      .setOrigin(0.5);

    // Hint
    const hint = this.add
      .text(width / 2, height * 0.58, this.getHint(), this.getTheme().typography.small)
      .setOrigin(0.5);
    hint.setName("gameOverHint");

    // 🔁 Pulse the hint (like the menu)
    try { this.hintTween?.stop(); } catch {}
    this.hintTween = this.tweens.add({
      targets: hint,
      alpha: { from: 1, to: 0.35 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Input to continue
    const goNext = () => this.scene.start(this.getNextSceneKey());
    this.input.on("pointerup", goNext);
    this.input.keyboard?.on("keydown-ENTER", goNext);
    this.input.keyboard?.on("keydown-SPACE", goNext);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off("pointerup", goNext);
      this.input.keyboard?.off("keydown-ENTER", goNext);
      this.input.keyboard?.off("keydown-SPACE", goNext);
    });
  }

  /** Optional override: draw parallax/logo/etc. */
  protected buildBackground?(): void;
}
