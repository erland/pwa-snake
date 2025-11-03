import Phaser from "phaser";
import { defaultSceneKeys, type SceneKeys } from "./sceneKeys";
import { defaultTheme } from "../ui/defaultTheme";
import type { Theme } from "../ui/Theme";
import type { GameServices } from "../core/types";

/**
 * Generic Game Over scene:
 * - Renders a centered title and retry hint (named children for easy access)
 * - Wires pointer + Enter/Space to go to the next scene
 * - Adds a pulsing tween on the hint with proper cleanup
 * - Exposes hooks for subclasses: getTitle, getRetryHint, afterCreate(data), buildBackground
 */
export abstract class BaseGameOverScene extends Phaser.Scene {
  constructor() { super("GameOver"); }

  private hintText?: Phaser.GameObjects.Text;
  private hintTween?: Phaser.Tweens.Tween;

  protected getSceneKeys(): SceneKeys {
    const services: any = this.game.registry.get("services");
    return (services && services.sceneKeys) || defaultSceneKeys;
  }

  protected getTheme(): Theme {
    const services = this.game.registry.get("services") as GameServices | undefined;
    return services?.theme ?? defaultTheme;
  }

  /** Override to customize the Game Over title (defaults to literal 'Game Over'). */
  protected getTitle(): string { return "Game Over"; }

  /** Override to customize the retry hint (localize). */
  protected getRetryHint(): string { return "Tap / Press Enter to Retry"; }

  /** Override to define where to go on retry (defaults to play). */
  protected getNextSceneKey(): string { return this.getSceneKeys().play; }

  /** Optional override: draw background (parallax/logo/etc.). */
  protected buildBackground(): void {}

  /** Optional hook: extend UI. Use provided data without overriding create(). */
  protected afterCreate(_data?: any): void {}

  public create(data?: any): void {
    const theme = this.getTheme();
    const { width, height } = this.scale;
    this.buildBackground();

    // Title
    const title = this.add
      .text(width * 0.5, height * 0.35, this.getTitle(), theme.typography.large)
      .setOrigin(0.5, 0.5);
    title.setName("gameOverTitle");

    // Hint
    this.hintText = this.add
      .text(width * 0.5, height * 0.60, this.getRetryHint(), theme.typography.small)
      .setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true });
    this.hintText.setName("gameOverHint");

    // Pulsing tween
    try { this.hintTween?.stop(); } catch {}
    this.hintTween = this.tweens.add({
      targets: this.hintText,
      alpha: { from: 1, to: 0.35 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Navigation handlers
    const goNext = () => this.scene.start(this.getNextSceneKey());
    this.hintText.on("pointerup", goNext);
    this.input.on("pointerup", goNext);
    this.input.keyboard?.on("keydown-ENTER", goNext);
    this.input.keyboard?.on("keydown-SPACE", goNext);

    // Allow subclass to add contents (e.g., scores) without overriding create()
    this.afterCreate(data);

    // Cleanup
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      try { this.hintTween?.stop(); } catch {}
      this.hintTween = undefined;
      try { this.hintText?.removeAllListeners(); } catch {}
      this.input.off("pointerup", goNext);
      this.input.keyboard?.off("keydown-ENTER", goNext);
      this.input.keyboard?.off("keydown-SPACE", goNext);
      this.hintText = undefined;
    });
  }
}