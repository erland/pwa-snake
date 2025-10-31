export interface RNG { next(): number; }
export class MathRNG implements RNG { next() { return Math.random(); } }

export class LCG implements RNG {
  private seed: number;
  constructor(seed = 123456789) { this.seed = seed >>> 0; }
  next() {
    let x = this.seed;
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17; x >>>= 0;
    x ^= x << 5;  x >>>= 0;
    this.seed = x >>> 0;
    return (this.seed % 0xFFFF_FFFF) / 0xFFFF_FFFF;
  }
}