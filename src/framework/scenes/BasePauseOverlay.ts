import Phaser from "phaser";
import { defaultTheme } from "../ui/defaultTheme";
import type { Theme } from "../ui/Theme";
import { defaultSceneKeys, type SceneKeys } from "./sceneKeys";
import type { GameServices } from "../core/types";

export abstract class BasePauseOverlay extends Phaser.Scene {
  constructor() { super("Pause"); }

  protected getSceneKeys(): SceneKeys {
    const services = this.game.registry.get("services") as GameServices | undefined;
    return services?.sceneKeys ?? defaultSceneKeys;
  }

  protected getTheme(): Theme {
    const services = this.game.registry.get("services") as GameServices | undefined;
    return services?.theme ?? defaultTheme;
  }

  create() {
    const { width, height } = this.scale;

    // semi-transparent scrim
    const scrim = this.add.rectangle(0, 0, width, height, 0x000000, 0.5).setOrigin(0);

    this.buildUI();
    this.enableResume();

    // keep scrim sized on resize
    const onResize = (gameSize: Phaser.Structs.Size) => {
      scrim.setSize(gameSize.width, gameSize.height);
    };
    this.scale.on("resize", onResize);

    // cleanup on shutdown
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", onResize);
      this.teardownResume();
    });
  }

  /** Subclass for custom pause UI (title, buttons, etc.). */
  protected buildUI(): void {
    const { width, height } = this.scale;
    const msg = `Paused\nPress ESC / Tap to Resume`;
    this.add
      .text(width / 2, height / 2, msg, this.getTheme().typography.medium)
      .setOrigin(0.5);
  }

  protected enableResume() {
    const playKey = this.getSceneKeys().play;
    const resume = () => { this.scene.stop(); this.scene.resume(playKey); };

    // store to detach later
    (this as any)._resumeHandler = resume;

    this.input.on("pointerup", resume);
    this.input.keyboard?.on("keydown-ESC", resume);
    this.input.keyboard?.on("keydown-SPACE", resume);
  }

  protected teardownResume() {
    const resume = (this as any)._resumeHandler as (() => void) | undefined;
    if (!resume) return;
    this.input.off("pointerup", resume);
    this.input.keyboard?.off("keydown-ESC", resume);
    this.input.keyboard?.off("keydown-SPACE", resume);
    (this as any)._resumeHandler = undefined;
  }
}