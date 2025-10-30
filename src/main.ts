// src/main.ts
import Phaser from 'phaser'
import GameScene from './phaser/GameScene'
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
  scene: [GameScene],
}

export default new Phaser.Game(config)
