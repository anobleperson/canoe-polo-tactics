import { cloneState, normaliseState } from './state.js';

export const DURATIONS = [0.5, 1, 1.5, 2, 3]; // seconds per frame transition
export const DEFAULT_DURATION = 1.5;

const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const lerp = (a, b, t) => a + (b - a) * t;

// Rotate the short way round, e.g. 350 -> 10 goes through 0.
function lerpAngle(a, b, t) {
  const d = ((((b - a) % 360) + 540) % 360) - 180;
  return (((a + d * t) % 360) + 360) % 360;
}

// Board state between frames a and b, t in [0, 1].
export function interpolate(a, b, t) {
  const e = ease(t);
  return {
    court: a.court,
    pieces: a.pieces.map((p) => {
      const q = b.pieces.find((x) => x.id === p.id) || p;
      return { ...p, x: lerp(p.x, q.x, e), y: lerp(p.y, q.y, e), angle: lerpAngle(p.angle, q.angle, e) };
    }),
    ball: { x: lerp(a.ball.x, b.ball.x, e), y: lerp(a.ball.y, b.ball.y, e) },
  };
}

// A sequence of board states (keyframes) on one court.
export class Animation {
  constructor(first, duration = DEFAULT_DURATION) {
    this.frames = [cloneState(first)];
    this.duration = duration;
  }

  get court() {
    return this.frames[0].court;
  }

  get last() {
    return this.frames.length - 1;
  }

  // Board state at a (possibly fractional) frame position.
  stateAt(pos) {
    const i = Math.min(Math.floor(pos), this.last);
    const t = pos - i;
    if (t <= 0 || i >= this.last) return cloneState(this.frames[i]);
    return interpolate(this.frames[i], this.frames[i + 1], t);
  }

  toJSON() {
    return { duration: this.duration, frames: this.frames };
  }

  static fromJSON(data) {
    const frames = (data?.frames || []).map(normaliseState);
    if (!frames.length) throw new Error('Animation has no frames.');
    const court = frames[0].court;
    const anim = new Animation(frames[0], DURATIONS.includes(data.duration) ? data.duration : DEFAULT_DURATION);
    anim.frames = frames.map((f) => ({ ...f, court }));
    return anim;
  }
}

// Drives playback from one frame position to another with requestAnimationFrame.
export class Player {
  constructor(onFrame) {
    this.onFrame = onFrame; // (pos) => void
    this.raf = null;
  }

  get playing() {
    return this.raf !== null;
  }

  play(anim, from, to, onDone) {
    this.stop();
    let pos = from;
    let lastTime = null;
    const tick = (now) => {
      if (lastTime !== null) pos = Math.min(to, pos + (now - lastTime) / 1000 / anim.duration);
      lastTime = now;
      this.onFrame(pos);
      if (pos >= to) {
        this.raf = null;
        onDone?.();
        return;
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    this.raf = null;
  }
}
