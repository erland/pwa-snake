// src/main.ts
import "./pwa";
import { GameHost } from "./framework";
import SnakeBootScene from "./game/SnakeBootScene";
import SnakeMenuScene from "./game/SnakeMenuScene";
import SnakePlayScene from "./game/SnakePlayScene";
import SnakeGameOverScene from "./game/SnakeGameOverScene";
import SnakePauseOverlay from "./game/SnakePauseOverlay";

GameHost.launch("app", [
  SnakeBootScene,
  SnakeMenuScene,
  SnakePlayScene,
  SnakeGameOverScene,
  SnakePauseOverlay,
], {
  width: 360,       // optional in RESIZE mode
  height: 640,      // optional in RESIZE mode
  backgroundColor: 0x000000,
  scaleMode: "resize",
  physics: false,
  pixelArt: true,
  antialias: false,
});