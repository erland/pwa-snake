// src/phaser/GameScene.ts
import Phaser from 'phaser'
import { GRID, STEP_MS, START_LEN, START_DIR } from '../game/constants'
import type { GameState, Point } from '../game/types'
import { placeFood } from '../game/rules'
import { advance } from '../game/step'
import { MathRandom } from '../game/rng'
import { isOpposite } from '../game/direction'

type Dir = GameState['dir']

export default class GameScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics
  private scoreText!: Phaser.GameObjects.Text
  private overText!: Phaser.GameObjects.Text

  private rng = new MathRandom()
  private state!: GameState

  // On-screen D-pad (decide later in create())
  private showDPad!: boolean
  private dpadCreated = false
  private btnUp?: Phaser.GameObjects.Container
  private btnDown?: Phaser.GameObjects.Container
  private btnLeft?: Phaser.GameObjects.Container
  private btnRight?: Phaser.GameObjects.Container

  constructor() {
    super('GameScene')
  }

  create() {
    // Decide if we should show on-screen controls (touch devices)
    const hasTouch = this.sys.game.device.input.touch || window.matchMedia?.('(pointer: coarse)').matches
    this.showDPad = !!hasTouch

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
      let nextDir: Dir | null = null
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

    // Swipe input
    let sx = 0, sy = 0
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      sx = p.x; sy = p.y
    })
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      // Tap to restart when game over
      if (this.state.isGameOver) {
        this.initState()
        this.draw()
        return
      }
      const dx = p.x - sx
      const dy = p.y - sy
      const adx = Math.abs(dx), ady = Math.abs(dy)
      const threshold = 12
      if (adx < threshold && ady < threshold) return
      const nextDir: Dir = adx > ady ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')
      if (!isOpposite(this.state.dir, nextDir)) {
        this.state.pendingDir = nextDir
      }
    })

    // D-pad for mobile/tablets
    if (this.showDPad) {
      this.createDPad()
      this.positionDPad()
    }
    
    // Keep centered & reposition UI on resize
    this.scale.on('resize', () => {
      this.positionUI()
      if (this.showDPad) this.positionDPad()
      this.draw()
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
    this.positionUI()
  }

  private positionUI() {
    this.overText.setPosition(this.scale.width / 2, this.scale.height / 2)
  }

  private onTick() {
    this.state = advance(this.state, this.rng)
    if (this.state.isGameOver) this.overText.setVisible(true)
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

  // ---------- D-Pad creation & layout ----------

  private makeButton(dir: Dir, label: string): Phaser.GameObjects.Container {
    const r = Math.max(18, Math.min(this.scale.width, this.scale.height) * 0.07)
    const bg = this.add.circle(0, 0, r, 0xffffff, 0.12)
      .setStrokeStyle(2, 0xffffff, 0.35).setDepth(30)
      .setInteractive({ useHandCursor: false }) // circle hit area
    const txt = this.add.text(0, 0, label, {
      fontFamily: 'monospace',
      fontSize: Math.round(r * 0.9) + 'px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(31)

    const c = this.add.container(0, 0, [bg, txt]).setDepth(32)
    c.setSize(r * 2, r * 2)
    c.setInteractive(new Phaser.Geom.Circle(0, 0, r), Phaser.Geom.Circle.Contains)

    const press = () => {
      if (this.state.isGameOver) {
        this.initState()
        this.draw()
        return
      }
      if (!isOpposite(this.state.dir, dir)) {
        this.state.pendingDir = dir
        // visual feedback
        bg.setFillStyle(0xffffff, 0.24)
        this.time.delayedCall(80, () => bg.setFillStyle(0xffffff, 0.12))
      }
    }
    c.on('pointerdown', press)
    c.on('pointerup', () => bg.setFillStyle(0xffffff, 0.12))
    c.on('pointerout', () => bg.setFillStyle(0xffffff, 0.12))

    return c
  }

  private createDPad() {
    if (this.dpadCreated) return
    this.btnUp = this.makeButton('up', '↑')
    this.btnDown = this.makeButton('down', '↓')
    this.btnLeft = this.makeButton('left', '←')
    this.btnRight = this.makeButton('right', '→')
    this.dpadCreated = true
  }

  private positionDPad() {
    if (!this.dpadCreated || !this.btnUp || !this.btnDown || !this.btnLeft || !this.btnRight) return
    const w = this.scale.width
    const h = this.scale.height
    const r = Math.max(18, Math.min(w, h) * 0.07)
    const gap = Math.max(8, r * 0.25)
    const margin = Math.max(8, Math.min(w, h) * 0.04)

    // bottom-right layout
    const cx = w - (r + margin)
    const cy = h - (r + margin)

    this.btnUp.setPosition(cx, cy - (r + gap))
    this.btnDown.setPosition(cx, cy + (r + gap))
    this.btnLeft.setPosition(cx - (r + gap), cy)
    this.btnRight.setPosition(cx + (r + gap), cy)
  }
}
