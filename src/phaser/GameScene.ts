// src/phaser/GameScene.ts
import Phaser from 'phaser'
import { GRID, STEP_MS, START_LEN, START_DIR } from '../game/constants'
import type { GameState, Point } from '../game/types'
import { placeFood } from '../game/rules'
import { advance } from '../game/step'
import { MathRandom } from '../game/rng'
import { isOpposite } from '../game/direction'

export default class GameScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics
  private scoreText!: Phaser.GameObjects.Text
  private overText!: Phaser.GameObjects.Text

  private rng = new MathRandom()
  private state!: GameState

  constructor() {
    super('GameScene')
  }

  create() {
    this.gfx = this.add.graphics()
    this.scoreText = this.add.text(8, 6, 'Score: 0', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
    }).setDepth(10)

    this.overText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      'Game Over — Tap to restart (or press R)',
      { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff' }
    ).setOrigin(0.5).setVisible(false).setDepth(10)

    this.initState()
    this.draw()

    // Timed tick
    this.time.addEvent({
      delay: STEP_MS,
      loop: true,
      callback: () => this.onTick(),
    })

    // Keyboard input
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      const k = e.code
      let nextDir: typeof this.state.dir | null = null
      if (k === 'ArrowUp' || k === 'KeyW') nextDir = 'up'
      else if (k === 'ArrowDown' || k === 'KeyS') nextDir = 'down'
      else if (k === 'ArrowLeft' || k === 'KeyA') nextDir = 'left'
      else if (k === 'ArrowRight' || k === 'KeyD') nextDir = 'right'
      else if (k === 'KeyR') {
        if (this.state.isGameOver) {
          this.initState()
          this.draw()
        }
      }

      if (nextDir && !isOpposite(this.state.dir, nextDir)) {
        this.state.pendingDir = nextDir
      }
    })

    // Simple swipe input for touch devices
    let sx = 0, sy = 0
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      sx = p.x; sy = p.y
    })
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      // restart on tap if game over (works on iPhone)
      if (this.state.isGameOver) {
        this.initState()
        this.draw()
        return
      }

      const dx = p.x - sx
      const dy = p.y - sy
      const adx = Math.abs(dx), ady = Math.abs(dy)
      const threshold = 10 // pixels
      if (adx < threshold && ady < threshold) return
      let nextDir: typeof this.state.dir
      if (adx > ady) nextDir = dx > 0 ? 'right' : 'left'
      else nextDir = dy > 0 ? 'down' : 'up'
      if (!isOpposite(this.state.dir, nextDir)) {
        this.state.pendingDir = nextDir
      }
    })

    // Redraw on resize so centering stays correct
    this.scale.on('resize', () => {
      this.positionUI()
      this.draw()
    })
  }

  private initState() {
    const midY = Math.floor(GRID.rows / 2)
    const startHeadX = Math.floor(GRID.cols / 2)
    const snake: Point[] = []
    for (let i = 0; i < START_LEN; i++) {
      // start facing START_DIR ('right' by default)
      snake.push({ x: startHeadX - i, y: midY })
    }

    const food = placeFood(snake, GRID, this.rng)

    this.state = {
      grid: GRID,
      dir: START_DIR,
      pendingDir: null,
      snake,
      food,
      score: 0,
      isGameOver: false,
    }

    this.scoreText.setText('Score: 0')
    this.overText.setVisible(false)
    this.positionUI()
  }

  private positionUI() {
    // Keep game-over text centered on resize
    this.overText.setPosition(this.scale.width / 2, this.scale.height / 2)
  }

  private onTick() {
    this.state = advance(this.state, this.rng)
    if (this.state.isGameOver) {
      this.overText.setVisible(true)
    }
    this.scoreText.setText('Score: ' + this.state.score)
    this.draw()
  }

  private draw() {
    const availW = this.scale.width
    const availH = this.scale.height
    const cell = Math.floor(Math.min(availW / GRID.cols, availH / GRID.rows)) || 1
    const offX = Math.floor((availW - cell * GRID.cols) / 2)
    const offY = Math.floor((availH - cell * GRID.rows) / 2)

    this.gfx.clear()

    // Background
    this.gfx.fillStyle(0x000000, 1)
    this.gfx.fillRect(0, 0, availW, availH)

    // Food
    this.gfx.fillStyle(0xe91e63, 1)
    this.gfx.fillRect(offX + this.state.food.x * cell, offY + this.state.food.y * cell, cell, cell)

    // Snake
    this.gfx.fillStyle(0x4caf50, 1)
    for (let i = 0; i < this.state.snake.length; i++) {
      const seg = this.state.snake[i]
      this.gfx.fillRect(offX + seg.x * cell, offY + seg.y * cell, cell, cell)
    }
  }
}
