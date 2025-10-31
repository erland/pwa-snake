import "./pwa";
import { GameHost } from "./framework/core/GameHost";
import SnakeBootScene from "./game/SnakeBootScene";
import SnakeMenuScene from "./game/SnakeMenuScene";
import SnakePlayScene from "./game/SnakePlayScene";
import SnakeGameOverScene from "./game/SnakeGameOverScene";
import SnakePauseOverlay from "./game/SnakePauseOverlay";

GameHost.launch("app", [
  new SnakeBootScene(),
  new SnakeMenuScene(),
  new SnakePlayScene(),
  new SnakeGameOverScene(),
  new SnakePauseOverlay(),
]);