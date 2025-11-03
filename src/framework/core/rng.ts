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

/** Deterministic RNG for tests: cycles through a provided sequence of integers. */
export class SeqRNG implements RNG {
  private i = 0;
  constructor(private seq: number[]) {}
  next(): number {
    if (!this.seq.length) return 0;
    const v = this.seq[this.i % this.seq.length];
    this.i++;
    // Normalize to [0,1) for consumers; randomInt() will scale appropriately.
    // If v might be >= 1, mod by a large number to keep in range.
    const n = Number.isFinite(v) ? v : 0;
    // Map integers to [0,1) deterministically; assume typical use is via randomInt().
    return (n % 1000000) / 1000000;
  }
}

/** Map float RNG.next() in [0,1) to an integer in [0, maxExclusive). */
export function randomInt(rng: RNG, maxExclusive: number): number {
  if (maxExclusive <= 1) return 0;
  return Math.floor(rng.next() * maxExclusive);
}

