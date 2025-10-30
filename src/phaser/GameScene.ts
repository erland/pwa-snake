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

  // --- polish anim state ---
  private pulse = 0 // advances a bit every tick

  // --- theme palette (feel free to tweak) ---
  private COLOR_BG = 0x000000
  private COLOR_TILE = 0x101010      // checkerboard dark tile
  private COLOR_FRAME = 0xffffff
  private COLOR_SNAKE = 0x43a047     // body green
  private COLOR_SNAKE_HEAD = 0x7cb342 // head green (brighter)
  private COLOR_SNAKE_OUTLINE = 0x1b5e20
  private COLOR_FOOD = 0xe91e63

  constructor() {
    super('GameScene')
  }
  // --- ensure we detect touch reliably on iOS / PWA / desktop spoofing ---
  private detectTouch(): boolean {
    const phaserTouch = !!this.sys?.game?.device?.input?.touch
    const coarse = typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches
    const maxPoints = typeof navigator !== 'undefined' ? (navigator as any).maxTouchPoints ?? 0 : 0
    const ontouch = typeof window !== 'undefined' && ('ontouchstart' in window)
    return Boolean(phaserTouch || coarse || ontouch || maxPoints > 0)
  }

  private destroyDPad() {
    this.btnUp?.destroy()
    this.btnDown?.destroy()
    this.btnLeft?.destroy()
    this.btnRight?.destroy()
    this.btnUp = this.btnDown = this.btnLeft = this.btnRight = undefined
    this.dpadCreated = false
  }

  create() {
    // Decide if we should show on-screen controls (touch devices)
    this.showDPad = this.detectTouch()
    // Optional local override for debugging (set via DevTools):
    try {
      const override = localStorage.getItem('snakeShowDpad')
      if (override === '1') this.showDPad = true
      if (override === '0') this.showDPad = false
    } catch {}
   

    this.gfx = this.add.graphics()
    this.scoreText = this.add.text(8, 6, 'Score: 0', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
    }).setDepth(10)

    this.overText = this.add.text(
      this.scale.width / 2,
      this.scale.height / 2,
      'Game Over — Tap to restart',
      { fontFamily: 'monospace', fontSize: '16px', color: '#ffffff' }
    ).setOrigin(0.5).setVisible(false).setDepth(10)

    this.initState()
    this.draw()

    // Timed tick (logic)
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

    // D-pad for mobile/tablets — ensure (re)creation and cleanup across restarts
    this.destroyDPad()
    if (this.showDPad) {
      this.createDPad()
      this.positionDPad()
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroyDPad())
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.destroyDPad())
   
    
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
    this.pulse = 0 // reset pulse animation
    this.positionUI()
  }

  private positionUI() {
    this.overText.setPosition(this.scale.width / 2, this.scale.height / 2)
  }

  private onTick() {
    this.state = advance(this.state, this.rng)
    if (this.state.isGameOver) {
      const finalScore = this.state.score
      // persist high score here as a safety (also done in GameOverScene)
      try {
        const prev = Number(localStorage.getItem('snakeHighScore') || '0')
        if (finalScore > prev) localStorage.setItem('snakeHighScore', String(finalScore))
      } catch {}
      this.scene.start('GameOverScene', { score: finalScore })
      return
    }
      
    this.scoreText.setText('Score: ' + this.state.score)

    // progress polish animation a bit each tick
    this.pulse = (this.pulse + 0.18) % (Math.PI * 2)

    this.draw()
  }

  private draw() {
    const availW = this.scale.width
    const availH = this.scale.height
    const cell = Math.floor(Math.min(availW / GRID.cols, availH / GRID.rows)) || 1
    const boardW = cell * GRID.cols
    const boardH = cell * GRID.rows
    const offX = Math.floor((availW - boardW) / 2)
    const offY = Math.floor((availH - boardH) / 2)
  
    this.gfx.clear()
  
    // Background
    this.gfx.fillStyle(this.COLOR_BG, 1)
    this.gfx.fillRect(0, 0, availW, availH)

    // Checkerboard inside board (subtle)
    if (cell >= 6) {
      this.gfx.fillStyle(this.COLOR_TILE, 0.45)
      for (let y = 0; y < GRID.rows; y++) {
        for (let x = 0; x < GRID.cols; x++) {
          if (((x + y) & 1) === 0) {
            this.gfx.fillRect(offX + x * cell, offY + y * cell, cell, cell)
          }
        }
      }
    }
  
    // Board frame (inside the play area)
    const border = Math.max(2, Math.floor(cell / 8))
    this.gfx.lineStyle(border, this.COLOR_FRAME, 0.85)
    this.gfx.strokeRect(offX + 0.5, offY + 0.5, boardW - 1, boardH - 1)

    // Food (pulsing circle with small highlight)
    const fx = offX + (this.state.food.x + 0.5) * cell
    const fy = offY + (this.state.food.y + 0.5) * cell
    const baseR = Math.max(3, cell * 0.33)
    const r = baseR * (1 + 0.08 * Math.sin(this.pulse))
    this.gfx.fillStyle(this.COLOR_FOOD, 1)
    this.gfx.fillCircle(fx, fy, r)
    // highlight dot
    this.gfx.fillStyle(0xffffff, 0.85)
    this.gfx.fillCircle(fx - r * 0.35, fy - r * 0.35, Math.max(1, r * 0.25))
  
    // Snake (rounded segments with thin outline; brighter head + eyes)
    const pad = Math.max(1, Math.floor(cell * 0.12))
    const segW = Math.max(1, cell - pad * 2)
    const segH = segW
    const radius = Math.max(2, Math.floor(segW * 0.25))
    for (let i = 0; i < this.state.snake.length; i++) {
      const seg = this.state.snake[i]
      const x = offX + seg.x * cell + pad
      const y = offY + seg.y * cell + pad

      const isHead = i === 0
      const fill = isHead ? this.COLOR_SNAKE_HEAD : this.COLOR_SNAKE
      this.gfx.fillStyle(fill, 1)
      this.gfx.fillRoundedRect(x, y, segW, segH, radius)

      // outline for definition
      this.gfx.lineStyle(Math.max(1, Math.floor(cell * 0.06)), this.COLOR_SNAKE_OUTLINE, 0.6)
      this.gfx.strokeRoundedRect(x, y, segW, segH, radius)

      // Head eyes (two dots facing direction)
      if (isHead && cell >= 8) {
        const eyeR = Math.max(1, Math.floor(cell * 0.08))
        const eyeOffset = Math.max(1, Math.floor(segW * 0.22))
        const frontOffset = Math.max(1, Math.floor(segW * 0.28))
        let ex1 = x + segW / 2, ey1 = y + segH / 2
        let ex2 = ex1, ey2 = ey1

        switch (this.state.dir) {
          case 'right':
            ex1 = x + segW - frontOffset; ey1 = y + eyeOffset
            ex2 = x + segW - frontOffset; ey2 = y + segH - eyeOffset
            break
          case 'left':
            ex1 = x + frontOffset; ey1 = y + eyeOffset
            ex2 = x + frontOffset; ey2 = y + segH - eyeOffset
            break
          case 'up':
            ex1 = x + eyeOffset; ey1 = y + frontOffset
            ex2 = x + segW - eyeOffset; ey2 = y + frontOffset
            break
          case 'down':
            ex1 = x + eyeOffset; ey1 = y + segH - frontOffset
            ex2 = x + segW - eyeOffset; ey2 = y + segH - frontOffset
            break
        }
        this.gfx.fillStyle(0xffffff, 0.95)
        this.gfx.fillCircle(ex1, ey1, eyeR)
        this.gfx.fillCircle(ex2, ey2, eyeR)
      }
    }
  }

  // ---------- D-Pad creation & layout ----------

  private makeButton(dir: Dir, label: string): Phaser.GameObjects.Container {
    const r = Math.max(18, Math.min(this.scale.width, this.scale.height) * 0.07)
  
    // Circle is the *interactive* element (not the container)
    const bg = this.add.circle(0, 0, r, 0xffffff, 0.12)
      .setStrokeStyle(2, 0xffffff, 0.35)
      .setDepth(30)
      .setInteractive({ useHandCursor: false })
  
    const txt = this.add.text(0, 0, label, {
      fontFamily: 'monospace',
      fontSize: Math.round(r * 0.9) + 'px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(31)
  
    const c = this.add.container(0, 0, [bg, txt]).setDepth(32)
    c.setSize(r * 2, r * 2) // layout only (no interactive on container)
  
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
  
    // Bind events to the circle so hit area matches visuals
    bg.on('pointerdown', press)
    bg.on('pointerup',   () => bg.setFillStyle(0xffffff, 0.12))
    bg.on('pointerout',  () => bg.setFillStyle(0xffffff, 0.12))
  
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
  
    // Button radius and spacing scale with screen size
    const r = Math.max(18, Math.min(w, h) * 0.07)
    const gap = Math.max(8, r * 0.25)
    const margin = Math.max(8, Math.min(w, h) * 0.04)
  
    // Read CSS safe-area insets (0 if not supported)
    const cs = getComputedStyle(document.documentElement)
    const insetR = parseFloat(cs.getPropertyValue('--safe-right'))  || 0
    const insetB = parseFloat(cs.getPropertyValue('--safe-bottom')) || 0
   
  
    // Place the D-pad center so the *outermost* buttons stay within margins.
    // Extent from center to outer edge = (2r + gap)
    const extent = 2 * r + gap
    const cx = w - (margin + insetR + extent)  // bottom-right, fully inside
    const cy = h - (margin + insetB + extent)
   
  
    this.btnUp.setPosition(   cx,             cy - (r + gap))
    this.btnDown.setPosition( cx,             cy + (r + gap))
    this.btnLeft.setPosition( cx - (r + gap), cy)
    this.btnRight.setPosition(cx + (r + gap), cy)
  }
}