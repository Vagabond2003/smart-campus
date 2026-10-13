/**
 * How the portal answers back: where the last press landed, the opt-in sounds, and the burst that
 * marks a finished task. Sounds are synthesised with Web Audio (no audio files), stay quiet, and
 * never play until a visitor turns them on in the display menu. Bursts are confetti in the
 * station's own colours (flag green, amber, platform cream), sized to the task, and never play
 * under reduced motion.
 */
import { prefersReducedMotion } from "./motion";

/* ─── Where the last press landed (a burst starts from the button that finished the task) ─── */

let lastPress = { x: 0, y: 0, at: 0 };
if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", (e) => (lastPress = { x: e.clientX, y: e.clientY, at: Date.now() }), { capture: true, passive: true });
}

/** The point a reaction should start from: the press just made, else the focused control, else mid-screen. */
export function originPoint(from?: Element | null) {
  const el = from ?? (Date.now() - lastPress.at < 1500 ? null : document.activeElement);
  if (el && el !== document.body && el.isConnected) {
    const r = el.getBoundingClientRect();
    if (r.width) return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  if (Date.now() - lastPress.at < 1500) return { x: lastPress.x, y: lastPress.y };
  return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
}

/* ─── Sounds ─────────────────────────────────────────────────────────────── */

export type Cue = "tick" | "tock" | "pop" | "chime" | "fanfare" | "whoosh" | "thud";

let soundOn = false;
let audio: AudioContext | null = null;

export function setSoundEnabled(on: boolean) {
  soundOn = on;
}

function ctx() {
  if (!audio) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    audio = new AC();
  }
  if (audio.state === "suspended") void audio.resume();
  return audio;
}

/** One soft tone: a sine with a quick attack and an exponential tail, optionally gliding in pitch. */
function tone(a: AudioContext, at: number, f0: number, f1: number, dur: number, gain: number, type: OscillatorType = "sine") {
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, at);
  if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, at + dur * 0.6);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g).connect(a.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

/** A struck bell: the note plus a quieter, slightly inharmonic partial, like a station chime. */
function bell(a: AudioContext, at: number, f: number, gain: number) {
  tone(a, at, f, f, 0.9, gain);
  tone(a, at, f * 2.76, f * 2.76, 0.35, gain * 0.18);
}

export function play(cue: Cue) {
  if (!soundOn) return;
  const a = ctx();
  if (!a) return;
  const t = a.currentTime + 0.005;
  switch (cue) {
    case "tick": // a toggle going on
      tone(a, t, 1500, 900, 0.05, 0.035, "triangle");
      break;
    case "tock": // a toggle going off
      tone(a, t, 900, 600, 0.05, 0.03, "triangle");
      break;
    case "pop": // something new appears
      tone(a, t, 380, 760, 0.12, 0.05);
      break;
    case "chime": // a task done: the two-note station chime
      bell(a, t, 659.25, 0.05);
      bell(a, t + 0.12, 987.77, 0.045);
      break;
    case "fanfare": // a big task done: the chime climbs a third note
      bell(a, t, 523.25, 0.05);
      bell(a, t + 0.11, 659.25, 0.05);
      bell(a, t + 0.22, 783.99, 0.05);
      break;
    case "whoosh": {
      // a theme change: filtered noise that sweeps up
      const len = Math.floor(a.sampleRate * 0.35);
      const buf = a.createBuffer(1, len, a.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = a.createBufferSource();
      src.buffer = buf;
      const bp = a.createBiquadFilter();
      bp.type = "bandpass";
      bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(400, t);
      bp.frequency.exponentialRampToValueAtTime(2400, t + 0.3);
      const g = a.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.05, t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
      src.connect(bp).connect(g).connect(a.destination);
      src.start(t);
      break;
    }
    case "thud": // something didn't save
      tone(a, t, 196, 130, 0.18, 0.06);
      break;
  }
}

/* ─── The burst ──────────────────────────────────────────────────────────── */

export type Celebration = "small" | "big";

function stationColours() {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return [v("--rail", "#006a4e"), v("--amber", "#ffb000"), v("--board-text", "#f3ead2"), v("--ok", "#00704f"), v("--amber", "#ffb000")];
}

/** Marks a finished task: the chime, and a burst of tickets and squares from the button that did it. */
export async function celebrate(size: Celebration, from?: Element | null) {
  play(size === "big" ? "fanfare" : "chime");
  if (prefersReducedMotion()) return;
  const o = originPoint(from);
  const { default: confetti } = await import("canvas-confetti");
  const ticket = confetti.shapeFromPath({ path: "M0 0h12v7H0z" });
  const base = {
    origin: { x: o.x / window.innerWidth, y: o.y / window.innerHeight },
    colors: stationColours(),
    shapes: [ticket, "square" as const],
    scalar: 0.85,
    zIndex: 95,
    disableForReducedMotion: true,
  };
  if (size === "small") {
    void confetti({ ...base, particleCount: 34, spread: 62, startVelocity: 24, gravity: 1.15, ticks: 140 });
    return;
  }
  void confetti({ ...base, particleCount: 70, spread: 70, startVelocity: 36, ticks: 190 });
  window.setTimeout(() => void confetti({ ...base, particleCount: 46, spread: 120, startVelocity: 26, decay: 0.92, ticks: 170 }), 150);
}
