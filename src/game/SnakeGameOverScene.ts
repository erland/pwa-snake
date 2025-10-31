import Phaser from "phaser";

export default class SnakeGameOverScene extends Phaser.Scene {
  constructor() { super("GameOver"); }

  create(data: { score: number }) {
    const score = data?.score ?? 0;

    // Update high score
    let high = 0;
    try {
      high = Number(localStorage.getItem("snakeHighScore") || "0");
      if (score > high) {
        high = score;
        localStorage.setItem("snakeHighScore", String(high));
      }
    } catch {}

    const w = this.scale.width, h = this.scale.height;

    const title = this.add.text(w/2, h/2 - 40, "Game Over", {
      fontFamily: "monospace", fontSize: "28px", color: "#ffffff",
    }).setOrigin(0.5);

    const stats = this.add.text(w/2, h/2, `Score: ${score}\nHigh: ${high}`, {
      fontFamily: "monospace", fontSize: "18px", color: "#ffffff", align: "center",
    }).setOrigin(0.5);

    const prompt = this.add.text(w/2, h/2 + 70, "Tap to Retry • Space/Enter", {
      fontFamily: "monospace", fontSize: "16px", color: "#ffffff",
    }).setOrigin(0.5);

    this.tweens.add({ targets: prompt, alpha: 0.35, duration: 700, yoyo: true, repeat: -1, ease: "sine.inout" });

    const restart = () => this.scene.start("Play");
    this.input.once("pointerup", restart);
    this.input.keyboard?.once("keydown-SPACE", restart);
    this.input.keyboard?.once("keydown-ENTER", restart);

    this.scale.on("resize", () => {
      title.setPosition(this.scale.width/2, this.scale.height/2 - 40);
      stats.setPosition(this.scale.width/2, this.scale.height/2);
      prompt.setPosition(this.scale.width/2, this.scale.height/2 + 70);
    });
  }
}