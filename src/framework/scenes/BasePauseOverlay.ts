import Phaser from "phaser";

export abstract class BasePauseOverlay extends Phaser.Scene {
  constructor() { super("Pause"); }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x000000, 0.5).setOrigin(0);
    this.buildUI();
    this.enableResume();
  }

  /** Subclass for custom pause UI. */
  protected buildUI(): void {
    const { width, height } = this.scale;
    this.add.text(width/2, height/2, "Paused\nPress ESC / Tap to Resume", {
      fontFamily: "system-ui, sans-serif", fontSize: "22px", align: "center",
    }).setOrigin(0.5);
  }

  protected enableResume() {
    const resume = () => { this.scene.stop(); this.scene.resume("Play"); };
    this.input.on("pointerup", resume);
    this.input.keyboard?.on("keydown-ESC", resume);
  }
}