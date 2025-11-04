import Phaser from "phaser";
import { Dir4 } from "../Dir4";

export type KeyMap = Partial<Record<Dir4, number[]>>;

export class KeyboardReader {
  private scene: Phaser.Scene;
  private keyMap: KeyMap;

  constructor(scene: Phaser.Scene, keyMap?: KeyMap) {
    this.scene = scene;
    this.keyMap = keyMap ?? {
      [Dir4.Up]:    [Phaser.Input.Keyboard.KeyCodes.UP, Phaser.Input.Keyboard.KeyCodes.W],
      [Dir4.Down]:  [Phaser.Input.Keyboard.KeyCodes.DOWN, Phaser.Input.Keyboard.KeyCodes.S],
      [Dir4.Left]:  [Phaser.Input.Keyboard.KeyCodes.LEFT, Phaser.Input.Keyboard.KeyCodes.A],
      [Dir4.Right]: [Phaser.Input.Keyboard.KeyCodes.RIGHT, Phaser.Input.Keyboard.KeyCodes.D],
    };
  }

  read(): Dir4 | null {
    const kb = this.scene.input.keyboard;
    if (!kb) return null;

    const isDown = (codes?: number[]) => !!codes?.some((code) => kb!.addKey(code, true).isDown);

    if (isDown(this.keyMap[Dir4.Up])) return Dir4.Up;
    if (isDown(this.keyMap[Dir4.Down])) return Dir4.Down;
    if (isDown(this.keyMap[Dir4.Left])) return Dir4.Left;
    if (isDown(this.keyMap[Dir4.Right])) return Dir4.Right;
    return null;
  }
}