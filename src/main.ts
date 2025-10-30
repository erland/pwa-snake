// src/main.ts
import Phaser from 'phaser'
import GameScene from './phaser/GameScene'
import { GRID, TILE_SIZE_PX } from './game/constants'
import './pwa' // registers the service worker (okay if vite-plugin-pwa present)

const width = GRID.cols * TILE_SIZE_PX
const height = GRID.rows * TILE_SIZE_PX

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',            // mount into <div id="app"></div>
  width,
  height,
  backgroundColor: '#000000',
  pixelArt: true,
  antialias: false,
  scene: [GameScene],
}

export default new Phaser.Game(config)
