import { BaseMenuScene } from "../framework/scenes/BaseMenuScene";
import { BaseTheme } from "../framework/ui/BaseTheme";
import { requestFullscreenIfPossible } from "../utils/fullscreen";

class SnakeTheme extends BaseTheme {
  getTitle(): string { return "Snake"; }
}

export default class SnakeMenuScene extends BaseMenuScene {
  constructor() { super(new SnakeTheme()); }

  protected startGame() {
    try { requestFullscreenIfPossible(); } catch {}
    this.scene.start("Play");
  }
}