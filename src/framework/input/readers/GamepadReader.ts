import Phaser from "phaser";
import { Dir4 } from "../Dir4";

export class GamepadReader {
  private scene: Phaser.Scene;
  private deadzone: number;

  constructor(scene: Phaser.Scene, deadzone = 0.25) {
    this.scene = scene;
    this.deadzone = deadzone;
  }

  read(): Dir4 | null {
    const pads = this.scene.input.gamepad?.gamepads ?? [];
    const pad = pads.find((p) => p && p.connected) as Phaser.Input.Gamepad.Gamepad | undefined;
    if (!pad) return null;

    // D-pad buttons first (standard mapping 12/13/14/15)
    const left  = pad.isButtonDown(14);
    const right = pad.isButtonDown(15);
    const up    = pad.isButtonDown(12);
    const down  = pad.isButtonDown(13);

    if (left) return Dir4.Left;
    if (right) return Dir4.Right;
    if (up) return Dir4.Up;
    if (down) return Dir4.Down;

    // Left stick as fallback
    const ax = pad.axes[0]?.getValue() ?? 0;
    const ay = pad.axes[1]?.getValue() ?? 0;

    if (Math.abs(ax) < this.deadzone && Math.abs(ay) < this.deadzone) return null;
    if (Math.abs(ax) > Math.abs(ay)) return ax < 0 ? Dir4.Left : Dir4.Right;
    return ay < 0 ? Dir4.Up : Dir4.Down;
  }
}