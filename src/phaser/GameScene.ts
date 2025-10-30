// src/phaser/GameScene.ts
import Phaser from 'phaser'
import { GRID, STEP_MS, START_LEN, START_DIR, TILE_SIZE_PX } from '../game/constants'
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
    this.scoreText = this.add.text(6, 4, 'Score: 0', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
    })

    this.overText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      'Game Over — Press R to restart',
      { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff' }
    ).setOrigin(0.5).setVisible(false)

    this.initState()
    this.draw()

    // Timed tick
    this.time.addEvent({
      delay: STEP_MS,
      loop: true,
      callback: () => this.onTick(),
    })

    // Keyboard input: listen to DOM keydown and set pendingDir (no unused locals)
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

      if (nextDir) {
        // Apply at next tick; ignore opposite
        if (!isOpposite(this.state.dir, nextDir)) {
          this.state.pendingDir = nextDir
        }
      }
    })
  }

  private initState() {
    const midY = Math.floor(GRID.rows / 2)
    const startHeadX = Math.floor(GRID.cols / 2)
    const snake: Point[] = []
    for (let i = 0; i < START_LEN; i++) {
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
  }

  private onTick() {
    const newState = advance(this.state, this.rng)
    this.state = newState
    if (this.state.isGameOver) {
      this.overText.setVisible(true)
    }
    this.scoreText.setText('Score: ' + this.state.score)
    this.draw()
  }

  private draw() {
    const w = this.scale.width
    const h = this.scale.height
    const size = TILE_SIZE_PX

    this.gfx.clear()

    // Background
    this.gfx.fillStyle(0x000000, 1)
    this.gfx.fillRect(0, 0, w, h)

    // Food
    this.gfx.fillStyle(0xe91e63, 1)
    this.gfx.fillRect(this.state.food.x * size, this.state.food.y * size, size, size)

    // Snake
    this.gfx.fillStyle(0x4caf50, 1)
    for (let i = 0; i < this.state.snake.length; i++) {
      const seg = this.state.snake[i]
      this.gfx.fillRect(seg.x * size, seg.y * size, size, size)
    }
  }
}
