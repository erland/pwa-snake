// src/game/rng.ts
export interface Random {
  // returns integer in [0, maxExclusive)
  nextInt(maxExclusive: number): number;
}

export class MathRandom implements Random {
  nextInt(maxExclusive: number): number {
    return Math.floor(Math.random() * maxExclusive);
  }
}

// Deterministic stub for tests
export class SeqRandom implements Random {
  private i = 0;
  private seq: number[];
  constructor(seq: number[]) { this.seq = seq; }
  
  nextInt(maxExclusive: number): number {
    if (this.seq.length === 0) return 0;
    const v = this.seq[this.i % this.seq.length] % maxExclusive;
    this.i++;
    return v;
  }
}
