import { defaultSceneKeys, type SceneKeys } from "./sceneKeys";
import Phaser from "phaser";
import { events, EVT } from "../core/events";
import { defaultTheme } from "../ui/defaultTheme";
import type { Theme } from "../ui/Theme";
import type { GameServices } from "../core/types";
import { requestFullscreenIfPossible } from "../utils/fullscreen";

export abstract class BaseMenuScene extends Phaser.Scene {
  constructor() { super("MainMenu"); }

  private hintText?: Phaser.GameObjects.Text;
  private hintTween?: Phaser.Tweens.Tween;
  private onKeyStart?: (ev?: any) => void;

  protected getSceneKeys(): SceneKeys {
    const services: any = this.game.registry.get("services");
    return (services && services.sceneKeys) || defaultSceneKeys;
  }

  protected getTheme(): Theme {
    const services = this.game.registry.get("services") as GameServices | undefined;
    return services?.theme ?? defaultTheme;
  }

  /** Accessor for the optional UI config stored in services (untyped for safety). */
  protected getUiConfig(): { autoFullscreen?: boolean } {
    const services: any = this.game.registry.get("services");
    return (services && services.ui) || {};
  }

  /** Override to customize the title (defaults to theme.title) */
  protected getTitle(): string {
    return this.getTheme().title;
  }

  /** By default, we respect the UI config flag (services.ui.autoFullscreen). */
  protected shouldRequestFullscreen(): boolean {
    const ui = this.getUiConfig();
    return !!ui.autoFullscreen;
  }

  create() {
    const { width, height } = this.scale;
    this.buildBackground();

    // Title
    const title = this.add
      .text(width / 2, height * 0.35, this.getTitle(), this.getTheme().typography.large)
      .setOrigin(0.5);
    title.setName("menuTitle");

    // Start hint
    this.hintText = this.add
      .text(width / 2, height * 0.55, this.getStartHint(), this.getTheme().typography.small)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerup", () => this.startGame());
    this.hintText.setName("menuHint");

    // 🔁 Pulse the hint
    try { this.hintTween?.stop(); } catch {}
    this.hintTween = this.tweens.add({
      targets: this.hintText,
      alpha: { from: 1, to: 0.35 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Keyboard + global bus
    const start = () => this.startGame();
    this.onKeyStart = start;
    this.input.keyboard?.on("keydown-ENTER", start);
    this.input.keyboard?.on("keydown-SPACE", start);
    events.once(EVT.START_GAME, start);

    // Let subclasses add extra UI without overriding create()
    this.afterCreate();

    // Cleanup on shutdown
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      try { this.hintTween?.stop(); } catch {}
      this.hintTween = undefined;
      if (this.onKeyStart) {
        this.input.keyboard?.off("keydown-ENTER", this.onKeyStart);
        this.input.keyboard?.off("keydown-SPACE", this.onKeyStart);
      }
      try { this.hintText?.removeAllListeners(); } catch {}
      this.hintText = undefined;
    });
  }

  /** Override to draw menu background (parallax, animated logo, etc.). */
  protected buildBackground(): void {}

  /** Optional hook: add extra UI after the base menu is created. */
  protected afterCreate(): void {}

  /** Override text hint easily (localize). */
  protected getStartHint(): string {
    return "Tap / Press Enter to Start";
  }

  /** Override to inject transition or setup. */
  protected startGame() {
    if (this.shouldRequestFullscreen()) {
      try { requestFullscreenIfPossible(); } catch {}
    }
    this.scene.start(this.getSceneKeys().play);
  }
}
