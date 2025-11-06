import { DirectionalInputController } from "@erlandlindmark/pwa-game-2d-framework";
import { Dir4 } from "@erlandlindmark/pwa-game-2d-framework";

export class SnakeInput extends DirectionalInputController {
  protected onDirection(dir: Dir4): void {
    switch (dir) {
      case Dir4.Left:  this.scene.events.emit("move_left");  break;
      case Dir4.Right: this.scene.events.emit("move_right"); break;
      case Dir4.Up:    this.scene.events.emit("move_up");    break;
      case Dir4.Down:  this.scene.events.emit("move_down");  break;
    }
  }
}