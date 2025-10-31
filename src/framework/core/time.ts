export class FixedStepper {
  private accumulator = 0;
  private readonly stepMs: number;
  private readonly maxCatchUp: number;

  constructor(hz = 60, maxCatchUp = 5) {
    this.stepMs = 1000 / hz;
    this.maxCatchUp = maxCatchUp;
  }

  tick(deltaMs: number, cb: (dtMs: number) => void) {
    this.accumulator += deltaMs;
    let guards = this.maxCatchUp;
    while (this.accumulator >= this.stepMs && guards-- > 0) {
      cb(this.stepMs);
      this.accumulator -= this.stepMs;
    }
  }
}