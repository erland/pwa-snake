import { defaultSceneKeys, type SceneKeys } from "./sceneKeys";
import Phaser from "phaser";
import { events, EVT } from "../core/events";
import { defaultTheme } from "../ui/defaultTheme";
import type { Theme } from "../ui/Theme";
import type { GameServices } from "../core/types";

export abstract class BaseMenuScene extends Phaser.Scene {
  protected getSceneKeys(): SceneKeys {
    const services: any = this.game.registry.get("services");
    return (services && services.sceneKeys) || defaultSceneKeys;
  }
  constructor() { super("MainMenu"); }

  protected getTheme(): Theme {
    const services = this.game.registry.get("services") as GameServices | undefined;
    return services?.theme ?? defaultTheme;
  }

  create() {
    const { width, height } = this.scale;
    this.buildBackground();

    this.add
      .text(width / 2, height * 0.35, this.getTheme().title, this.getTheme().typography.large)
      .setOrigin(0.5);

    const start = this.add
      .text(width / 2, height * 0.55, this.getStartHint(), this.getTheme().typography.small)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerup", () => this.startGame());

    start.setName("startHint");

    this.input.keyboard?.on("keydown-ENTER", () => this.startGame());
    events.once(EVT.START_GAME, () => this.startGame());
  }

  /** Override to draw menu background (parallax, animated logo, etc.). */
  protected buildBackground(): void {}

  /** Override text hint easily (localize). */
  protected getStartHint(): string {
    return "Tap / Press Enter to Start";
  }

  /** Override to inject transition or setup. */
  protected startGame() {
    this.scene.start("Play");
  }
}