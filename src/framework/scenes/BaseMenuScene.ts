import Phaser from "phaser";
import { events, EVT } from "../core/events";
import { BaseTheme } from "../ui/BaseTheme";

export abstract class BaseMenuScene extends Phaser.Scene {
  protected theme: BaseTheme;

  constructor(theme: BaseTheme) {
    super("MainMenu");
    this.theme = theme;
  }

  create() {
    const { width, height } = this.scale;
    this.buildBackground();

    this.add.text(width/2, height*0.35, this.theme.getTitle(), this.theme.textStyleLarge())
      .setOrigin(0.5);

    const start = this.add.text(width/2, height*0.55, this.getStartHint(), this.theme.textStyleSmall())
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerup", () => this.startGame());

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