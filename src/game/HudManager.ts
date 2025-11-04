import { PlayHud } from "./PlayHud";

/**
 * HudManager wraps PlayHud and handles high score persistence.
 * - Reads initial high score from localStorage.
 * - Updates score per frame.
 * - Persists new high on finalize().
 */
export class HudManager {
  private hud: PlayHud;
  private best = 0;

  constructor(private scene: Phaser.Scene, private storageKey = "snakeHighScore") {
    this.hud = new PlayHud(scene);
  }

  init(): void {
    let high = 0;
    try { high = Number(localStorage.getItem(this.storageKey) || "0"); } catch {}
    this.best = isFinite(high) ? high : 0;
    this.hud.init(this.best);
  }

  update(score: number): void {
    if (score > this.best) this.best = score;
    this.hud.updateScore(score);
  }

  finalize(finalScore: number): void {
    if (finalScore > this.best) {
      this.best = finalScore;
    }
    // Persist
    try { localStorage.setItem(this.storageKey, String(this.best)); } catch {}
  }

  destroy(): void {
    this.hud.destroy();
  }
}