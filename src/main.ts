// src/main.ts
import Phaser from 'phaser'
import StartScene from './phaser/StartScene'
import GameScene from './phaser/GameScene'
import GameOverScene from './phaser/GameOverScene'
import './pwa' // SW registration (no-op in dev if plugin disabled)

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#000000',
  pixelArt: true,
  antialias: false,
  // Let Phaser canvas resize with the container (good for desktop + mobile)
  scale: {
    mode: Phaser.Scale.RESIZE
  },
  scene: [StartScene, GameScene, GameOverScene], // StartScene runs first
}

export default new Phaser.Game(config)
