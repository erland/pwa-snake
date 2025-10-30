// tests/smoke.test.ts
describe('ts-jest works', () => {
  it('adds numbers with TS types', () => {
    const add = (a: number, b: number): number => a + b;
    expect(add(2, 3)).toBe(5);
  });
});
