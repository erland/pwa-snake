// tests/step.test.ts
import { advance } from '../src/game/step';
import type { GameState, GridConfig } from '../src/game/types';
import { SeqRandom } from '../src/game/rng';

const GRID: GridConfig = { cols: 6, rows: 6 };

function makeState(): GameState {
  return {
    grid: GRID,
    dir: "right",
    pendingDir: null,
    snake: [{x:2,y:3},{x:1,y:3},{x:0,y:3}], // length 3, moving right
    food: { x: 4, y: 3 },
    score: 0,
    isGameOver: false
  };
}

test('basic movement moves head forward and drops tail', () => {
  const rng = new SeqRandom([0]);
  let s = makeState();
  s = advance(s, rng);
  expect(s.snake[0]).toEqual({ x:3, y:3 });
  expect(s.snake.length).toBe(3);
  expect(s.score).toBe(0);
});

test('pendingDir applies on tick and rejects 180-degree reversal', () => {
  const rng = new SeqRandom([0]);
  let s = makeState();
  s.pendingDir = "left"; // opposite of "right" -> should be ignored
  s = advance(s, rng);
  expect(s.dir).toBe("right");
  expect(s.snake[0]).toEqual({ x:3, y:3 });

  // Now set a valid change to "down"
  s.pendingDir = "down";
  s = advance(s, rng);
  expect(s.dir).toBe("down");
  expect(s.snake[0]).toEqual({ x:3, y:4 });
});

test('eating food grows snake and increments score', () => {
  const rng = new SeqRandom([0]);
  let s = makeState();
  // Place food right in front of the head
  s.food = { x: 3, y: 3 };
  s = advance(s, rng);
  expect(s.snake.length).toBe(4); // grew
  expect(s.score).toBe(1);
  // Food should have respawned to a free cell
  const onSnake = s.snake.some(seg => seg.x === s.food.x && seg.y === s.food.y);
  expect(onSnake).toBe(false);
});

test('wall collision sets game over and freezes state', () => {
  const rng = new SeqRandom([0]);
  let s = makeState();
  // March to the right edge
  s = advance(s, rng); // head to (3,3)
  s = advance(s, rng); // head to (4,3)
  s = advance(s, rng); // head to (5,3)
  // Next move hits wall at (6,3)
  s = advance(s, rng);
  expect(s.isGameOver).toBe(true);

  // Further advances should not change state
  const frozen = advance(s, rng);
  expect(frozen).toBe(s);
});

test('self collision sets game over', () => {
  const rng = new SeqRandom([0]);
  const s: GameState = {
    grid: GRID,
    dir: "up",
    pendingDir: null,
    // head at (2,2), body forms a loop so moving up hits self at (2,1)
    snake: [{x:2,y:2},{x:2,y:3},{x:1,y:3},{x:1,y:2},{x:1,y:1},{x:2,y:1}],
    food: { x: 0, y: 0 },
    score: 0,
    isGameOver: false
  };
  const s2 = advance(s, rng);
  expect(s2.isGameOver).toBe(true);
});