// tests/rules.test.ts
import { hitsWall, hitsSelf, placeFood } from '../src/game/rules';
import type { GridConfig, Point } from '../src/game/types';
import { SeqRandom } from '../src/game/rng';

const GRID: GridConfig = { cols: 4, rows: 3 };

test('hitsWall detects borders', () => {
  expect(hitsWall({ x: -1, y: 0 }, GRID)).toBe(true);
  expect(hitsWall({ x: 4, y: 0 }, GRID)).toBe(true);
  expect(hitsWall({ x: 0, y: -1 }, GRID)).toBe(true);
  expect(hitsWall({ x: 0, y: 3 }, GRID)).toBe(true);
  expect(hitsWall({ x: 0, y: 0 }, GRID)).toBe(false);
  expect(hitsWall({ x: 3, y: 2 }, GRID)).toBe(false);
});

test('hitsSelf detects collision with body', () => {
  const snake: Point[] = [{x:1,y:1},{x:1,y:2},{x:1,y:3}];
  expect(hitsSelf({x:1,y:2}, snake)).toBe(true);
  expect(hitsSelf({x:0,y:0}, snake)).toBe(false);
});

test('placeFood never places on snake', () => {
  const snake: Point[] = [{x:1,y:1},{x:2,y:1}];
  const rng = new SeqRandom([0,1,2,3,4,5,6,7,8]);
  for (let i=0;i<10;i++) {
    const food = placeFood(snake, GRID, rng);
    expect(snake.find(s => s.x === food.x && s.y === food.y)).toBeUndefined();
    expect(food.x).toBeGreaterThanOrEqual(0);
    expect(food.y).toBeGreaterThanOrEqual(0);
    expect(food.x).toBeLessThan(GRID.cols);
    expect(food.y).toBeLessThan(GRID.rows);
  }
});

test('placeFood picks the only free cell when nearly full', () => {
  // Fill all but (3,2)
  const snake: Point[] = [];
  for (let y=0;y<GRID.rows;y++) {
    for (let x=0;x<GRID.cols;x++) {
      if (!(x===3 && y===2)) snake.push({x,y});
    }
  }
  const rng = new SeqRandom([5,7,1]); // whatever, there is only one choice
  const food = placeFood(snake, GRID, rng);
  expect(food).toEqual({ x:3, y:2 });
});
