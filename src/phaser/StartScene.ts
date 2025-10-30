// src/phaser/StartScene.ts
import Phaser from 'phaser'
import { requestFullscreenIfPossible } from '../utils/fullscreen'

export default class StartScene extends Phaser.Scene {
  constructor() { super('StartScene') }

  create(data: { lastScore?: number } = {}) {
    const { width: w, height: h } = this.scale

    const title = this.add.text(w/2, h/2 - 70, 'S N A K E', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#ffffff'
    }).setOrigin(0.5)

    const hint = this.add.text(w/2, h/2, 'Swipe or Arrow Keys\nD-pad on touch devices', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#cccccc',
      align: 'center'
    }).setOrigin(0.5)

    const prompt = this.add.text(w/2, h/2 + 80, 'Tap to Start • Space/Enter', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5)

    // Pulse the prompt a bit
    this.tweens.add({ targets: prompt, alpha: 0.35, duration: 700, yoyo: true, repeat: -1, ease: 'sine.inout' })

    // Show high score if any
    let high = 0
    try { high = Number(localStorage.getItem('snakeHighScore') || '0') } catch {}
    if (high > 0) {
      this.add.text(w/2, h - 28, `High score: ${high}`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#8bc34a'
      }).setOrigin(0.5)
    }

    const start = () => {
      requestFullscreenIfPossible();
      this.scene.start('GameScene');
    }
    this.input.once('pointerup', start)
    this.input.keyboard?.once('keydown-SPACE', start)
    this.input.keyboard?.once('keydown-ENTER', start)

    // Keep centered on resize
    this.scale.on('resize', () => {
      title.setPosition(this.scale.width/2, this.scale.height/2 - 70)
      hint.setPosition(this.scale.width/2, this.scale.height/2)
      prompt.setPosition(this.scale.width/2, this.scale.height/2 + 80)
    })
  }
}