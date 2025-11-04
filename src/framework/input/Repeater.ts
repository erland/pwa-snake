import { Dir4 } from "./Dir4";

export class Repeater {
  constructor(
    private repeatMode: "edge" | "repeat" = "repeat",
    private throttleMs = 60,
    private repeatEveryMs?: number
  ) {}

  private held: Dir4 | null = null;
  private nextRepeatAt = 0;

  tick(nowMs: number, read: () => Dir4 | null, emit: (d: Dir4) => void) {
    const d = read();

    // Edge detection
    if (d && d !== this.held) {
      this.held = d;
      this.nextRepeatAt = nowMs + this.throttleMs;
      emit(d);
      return;
    }

    if (!d) {
      this.held = null;
      return;
    }

    if (this.repeatMode === "edge") return;

    const every = this.repeatEveryMs ?? this.throttleMs;
    if (nowMs >= this.nextRepeatAt) {
      emit(d);
      this.nextRepeatAt = nowMs + every;
    }
  }
}