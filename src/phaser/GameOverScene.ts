// src/phaser/GameOverScene.ts
import Phaser from 'phaser'

export default class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene') }

  create(data: { score: number }) {
    const score = data?.score ?? 0

    // Update high score
    let high = 0
    try {
      high = Number(localStorage.getItem('snakeHighScore') || '0')
      if (score > high) {
        high = score
        localStorage.setItem('snakeHighScore', String(high))
      }
    } catch {}

    const { width: w, height: h } = this.scale

    const title = this.add.text(w/2, h/2 - 70, 'G A M E  O V E R', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffffff'
    }).setOrigin(0.5)

    const lines: string[] = [
      `Score: ${score}`,
      `High score: ${high}`
    ]

    const info = this.add.text(w/2, h/2, lines.join('\n'), {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#cccccc',
      align: 'center',
      lineSpacing: 6
    }).setOrigin(0.5)

    const prompt = this.add.text(w/2, h/2 + 90, 'Tap to Retry • Space/Enter', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5)

    this.tweens.add({ targets: prompt, alpha: 0.35, duration: 700, yoyo: true, repeat: -1, ease: 'sine.inout' })

    const restart = () => this.scene.start('GameScene')
    this.input.once('pointerup', restart)
    this.input.keyboard?.once('keydown-SPACE', restart)
    this.input.keyboard?.once('keydown-ENTER', restart)

    this.scale.on('resize', () => {
      title.setPosition(this.scale.width/2, this.scale.height/2 - 70)
      info.setPosition(this.scale.width/2, this.scale.height/2)
      prompt.setPosition(this.scale.width/2, this.scale.height/2 + 90)
    })
  }
}