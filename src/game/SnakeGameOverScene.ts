import Phaser from "phaser";

export default class SnakeGameOverScene extends Phaser.Scene {
  constructor() { super("GameOver"); }

  create(data: { score: number }) {
    const score = Math.max(0, Number(data?.score ?? 0));

    // Read/update high score
    let high = 0;
    try {
      high = Number(localStorage.getItem("snakeHighScore") || "0");
      if (score > high) {
        high = score;
        localStorage.setItem("snakeHighScore", String(high));
      }
    } catch {}

    // Initial layout
    const title = this.add.text(this.scale.width / 2, this.scale.height / 2 - 70, "Game Over", {
      fontFamily: "monospace", fontSize: "36px", color: "#ffffff",
    }).setOrigin(0.5);

    const stats = this.add.text(this.scale.width / 2, this.scale.height / 2, `Score: ${score}   High: ${high}`, {
      fontFamily: "monospace", fontSize: "18px", color: "#ffffff", align: "center",
    }).setOrigin(0.5);

    const prompt = this.add.text(this.scale.width / 2, this.scale.height / 2 + 90, "Tap to Restart • Space/Enter", {
      fontFamily: "monospace", fontSize: "16px", color: "#ffffff",
    }).setOrigin(0.5);

    // Pulse like the working build
    this.tweens.add({
      targets: prompt,
      alpha: 0.35,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "sine.inout",
    });

    // Restart handlers
    const restart = () => this.scene.start("Play");
    this.input.once("pointerup", restart);
    this.input.keyboard?.once("keydown-SPACE", restart);
    this.input.keyboard?.once("keydown-ENTER", restart);

    // Keep layout centered under RESIZE and clean up listener on shutdown
    const onResize = () => {
      const w = this.scale.width, h = this.scale.height;
      title.setPosition(w / 2, h / 2 - 70);
      stats.setPosition(w / 2, h / 2);
      prompt.setPosition(w / 2, h / 2 + 90);
    };
    this.scale.on("resize", onResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", onResize);
    });
  }
}