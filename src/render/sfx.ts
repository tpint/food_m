// Tiny WebAudio synth so the PoC has satisfying sounds without asset files.

import type { CustomerKind, FoodId } from '../game/config';

let ac: AudioContext | null = null;
let muted = false;
try { muted = localStorage.getItem('food-muted') === '1'; } catch { /* ignore */ }

function ctx() {
  if (!ac) ac = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.15, slide = 0) {
  if (muted) return;
  const a = ctx();
  const t = a.currentTime + start;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

let noiseBuf: AudioBuffer | null = null;

/** One second of white noise, made once and looped. */
function noiseBuffer(a: AudioContext): AudioBuffer {
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, a.sampleRate, a.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

// ------------------------------------------------------------------ voice toolkit
// Small building blocks for the richer sounds below (sizzles, slurps,
// customer cheers). Envelopes are lists of [time, value] points relative to `start`.

type Pts = [number, number][];

function curve(param: AudioParam, t0: number, pts: Pts, exp = false) {
  param.setValueAtTime(Math.max(exp ? 0.0001 : 0, pts[0][1]), t0 + pts[0][0]);
  for (const [t, v] of pts.slice(1)) {
    if (exp) param.exponentialRampToValueAtTime(Math.max(0.0001, v), t0 + t);
    else param.linearRampToValueAtTime(v, t0 + t);
  }
}

let echoIn: AudioNode | null = null;

/** Shared echo for the bigger moments: delay with filtered feedback. */
function echo(): AudioNode {
  const a = ctx();
  if (!echoIn) {
    const input = a.createGain();
    const delay = a.createDelay(1);
    delay.delayTime.value = 0.22;
    const fb = a.createGain();
    fb.gain.value = 0.38;
    const lp = a.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2200;
    const wet = a.createGain();
    wet.gain.value = 0.45;
    input.connect(delay).connect(lp).connect(fb).connect(delay);
    lp.connect(wet).connect(a.destination);
    echoIn = input;
  }
  return echoIn;
}

let driveCurve: Float32Array<ArrayBuffer> | null = null;

/** Soft distortion for growly voices. */
function drive(): WaveShaperNode {
  const a = ctx();
  if (!driveCurve) {
    driveCurve = new Float32Array(new ArrayBuffer(1024 * 4));
    for (let i = 0; i < 1024; i++) { const x = (i / 1023) * 2 - 1; driveCurve[i] = Math.tanh(x * 3.2); }
  }
  const w = a.createWaveShaper();
  w.curve = driveCurve;
  return w;
}

interface VoiceOpts {
  filter?: { type: BiquadFilterType; freq: Pts; q?: number };
  vibrato?: { rate: number; depth: number };
  tremolo?: { rate: number; depth: number };
  distort?: boolean;
  echo?: number;          // send level to the shared echo
}

/** Route `src` through optional filter / distortion into a gain envelope. */
function chain(a: AudioContext, src: AudioNode, t: number, gain: Pts, o: VoiceOpts): GainNode {
  let node: AudioNode = src;
  if (o.filter) {
    const f = a.createBiquadFilter();
    f.type = o.filter.type;
    f.Q.value = o.filter.q ?? 1;
    curve(f.frequency, t, o.filter.freq, true);
    node.connect(f);
    node = f;
  }
  if (o.distort) { const d = drive(); node.connect(d); node = d; }
  const g = a.createGain();
  curve(g.gain, t, gain);
  node.connect(g);
  g.connect(a.destination);
  if (o.echo) { const e = a.createGain(); e.gain.value = o.echo; g.connect(e).connect(echo()); }
  if (o.tremolo) {
    const lfo = a.createOscillator(), depth = a.createGain();
    lfo.frequency.value = o.tremolo.rate;
    depth.gain.value = o.tremolo.depth;
    lfo.connect(depth).connect(g.gain);
    lfo.start(t);
    lfo.stop(t + gain[gain.length - 1][0] + 0.05);
  }
  return g;
}

function osc(type: OscillatorType, start: number, freq: Pts, gain: Pts, o: VoiceOpts = {}) {
  if (muted) return;
  const a = ctx();
  const t = a.currentTime + start;
  const os = a.createOscillator();
  os.type = type;
  curve(os.frequency, t, freq, true);
  if (o.vibrato) {
    const lfo = a.createOscillator(), depth = a.createGain();
    lfo.frequency.value = o.vibrato.rate;
    depth.gain.value = o.vibrato.depth;
    lfo.connect(depth).connect(os.frequency);
    lfo.start(t);
    lfo.stop(t + gain[gain.length - 1][0] + 0.05);
  }
  chain(a, os, t, gain, o);
  const end = gain[gain.length - 1][0];
  os.start(t);
  os.stop(t + end + 0.05);
}

function hiss(start: number, gain: Pts, filter: VoiceOpts['filter'], o: VoiceOpts = {}) {
  if (muted) return;
  const a = ctx();
  const t = a.currentTime + start;
  const src = a.createBufferSource();
  src.buffer = noiseBuffer(a);
  src.loop = true;
  src.playbackRate.value = 0.7 + Math.random() * 0.6;
  chain(a, src, t, gain, { ...o, filter });
  const end = gain[gain.length - 1][0];
  src.start(t, Math.random() * 0.5);
  src.stop(t + end + 0.05);
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/** Short random clicks/bursts spread over a time span (sizzle crackle, crunches). */
function bursts(start: number, span: number, n: number, f: number, q: number, vol: number, len = 0.02) {
  for (let i = 0; i < n; i++) {
    const t = start + Math.random() * span;
    hiss(t, [[0, 0], [0.003, vol * rnd(0.5, 1)], [len, 0]], { type: 'bandpass', freq: [[0, f * rnd(0.7, 1.4)], [len, f]], q });
  }
}

/** A bright little bell, e.g. a plate clink or the cash register. */
function bell(start: number, f: number, vol = 0.06, len = 0.6) {
  osc('sine', start, [[0, f], [len, f * 0.998]], [[0, 0], [0.004, vol], [len, 0]], { echo: 0.2 });
  osc('sine', start, [[0, f * 2.76], [len * 0.5, f * 2.75]], [[0, 0], [0.004, vol * 0.35], [len * 0.5, 0]]);
}

const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];

export const sfx = {
  get muted() { return muted; },
  toggle() {
    muted = !muted;
    try { localStorage.setItem('food-muted', muted ? '1' : '0'); } catch { /* ignore */ }
    return muted;
  },
  pick: () => tone(660, 0, 0.06, 'triangle', 0.08),
  drop: () => tone(330, 0, 0.08, 'triangle', 0.08),
  /** A station cooks something: a soft pop and a sizzle. */
  spawn: () => {
    tone(420, 0, 0.1, 'sine', 0.12, 1.9);
    hiss(0.02, [[0, 0], [0.02, 0.05], [0.18, 0]], { type: 'highpass', freq: [[0, 3000], [0.18, 5000]] });
  },
  merge(level: number) {
    const base = Math.min(level - 1, 4);
    [0, 2, 4].forEach((s, i) => tone(scale[base + s] ?? scale[7], i * 0.06, 0.25, 'triangle', 0.12));
    tone(scale[base] * 2, 0.18, 0.4, 'sine', 0.06);
  },
  coin: () => { tone(1318, 0, 0.08, 'square', 0.04); tone(1760, 0.07, 0.18, 'square', 0.04); },
  error: () => tone(160, 0, 0.18, 'sawtooth', 0.06, 0.7),
  /** The cash register: a ka-ching and a cheerful arpeggio. */
  served() {
    bursts(0, 0.08, 4, 3000, 4, 0.08, 0.015);
    bell(0.08, 2093, 0.07, 0.8); bell(0.12, 2637, 0.05, 0.7);
    [0, 2, 4, 7].forEach((s, i) => tone(scale[s % 8] * (s >= 7 ? 2 : 1), 0.2 + i * 0.07, 0.3, 'triangle', 0.08));
  },
  /**
   * A dish being plated up over `ms`: a sizzle that swells, little pings
   * climbing a major scale as the plate draws itself (more at higher
   * levels), and a clink of the plate at the end.
   */
  plate(level: number, ms: number) {
    const d = ms / 1000;
    hiss(0, [[0, 0], [d * 0.7, 0.03 + level * 0.004], [d, 0.02], [d + 0.1, 0]], { type: 'highpass', freq: [[0, 2500], [d, 4500]], q: 0.7 });
    bursts(0, d, 4 + level * 2, 4200, 6, 0.05, 0.01);
    const n = 2 + level;
    for (let i = 0; i < n; i++) {
      const f = scale[(i + level) % scale.length] * (i + level >= scale.length ? 2 : 1);
      osc('sine', (i / n) * d * 0.9, [[0, f], [0.3, f]], [[0, 0], [0.008, 0.035], [0.3, 0]], { echo: 0.3 });
    }
    bell(d * 0.95, 1568 + level * 60, 0.05, 0.35);
  },
  /** A dish swooshing over to a customer. */
  whoosh(level: number) {
    const k = 0.6 + level * 0.08, d = 0.5;
    hiss(0, [[0, 0], [d * 0.7, 0.12 * k], [d + 0.05, 0]], { type: 'bandpass', freq: [[0, 600], [d * 0.7, 2000], [d + 0.05, 900]], q: 1.4 });
    osc('sine', 0, [[0, 500], [d, 900]], [[0, 0], [d * 0.6, 0.025 * k], [d, 0]]);
  },
  /** A customer tasting the dish: each kind of food has its own sound; bigger dishes are louder. */
  yum(food: FoodId, level: number) {
    const k = 0.6 + level * 0.1;
    if (food === 'bakery') {
      // Crunchy crust.
      for (let i = 0; i < 3; i++) bursts(i * 0.11, 0.06, 6, 1800, 2, 0.12 * k, 0.025);
    } else if (food === 'drinks') {
      // A slurp, then a gulp.
      hiss(0, [[0, 0], [0.05, 0.07 * k], [0.28, 0.05 * k], [0.32, 0]], { type: 'bandpass', freq: [[0, 900], [0.3, 2600]], q: 3 });
      osc('sine', 0.36, [[0, 180], [0.08, 420]], [[0, 0], [0.01, 0.16 * k], [0.1, 0]]);
    } else if (food === 'dessert') {
      // Sweet sparkly chimes.
      [0, 4, 7, 12].forEach((s, i) => osc('sine', i * 0.06, [[0, 1046.5 * Math.pow(2, s / 12)], [0.4, 1046.5 * Math.pow(2, s / 12)]], [[0, 0], [0.006, 0.04 * k], [0.4, 0]], { echo: 0.3 }));
    } else {
      // A juicy sizzle.
      hiss(0, [[0, 0], [0.03, 0.1 * k], [0.4, 0]], { type: 'highpass', freq: [[0, 3000], [0.4, 5000]] });
      bursts(0, 0.4, 10, 4000, 6, 0.06 * k, 0.012);
    }
    // Everybody says "mmm".
    osc('triangle', 0.15, [[0, 220], [0.15, 260], [0.45, 200]], [[0, 0], [0.06, 0.05], [0.4, 0.04], [0.5, 0]], { filter: { type: 'lowpass', freq: [[0, 700], [0.5, 500]] }, vibrato: { rate: 5, depth: 4 } });
    if (level >= 5) [0, 4, 7].forEach((s, i) => tone(scale[0] * 2 * Math.pow(2, s / 12), 0.3 + i * 0.07, 0.3, 'triangle', 0.05));
  },

  /** A customer's happy thank-you as they leave. */
  customerCheer(kind: CustomerKind) {
    switch (kind) {
      case 'bunny': // three happy squeaks
        [0, 0.09, 0.18].forEach((t, i) => osc('sine', t, [[0, 1500 + i * 200], [0.07, 2100 + i * 200]], [[0, 0], [0.01, 0.07], [0.08, 0]]));
        break;
      case 'cat': // a contented meow
        osc('sawtooth', 0, [[0, 520], [0.15, 760], [0.45, 480]], [[0, 0], [0.04, 0.08], [0.35, 0.06], [0.5, 0]], { filter: { type: 'bandpass', freq: [[0, 1000], [0.2, 1800], [0.5, 900]], q: 4 } });
        break;
      case 'bear': // a deep, satisfied "mmmm"
        osc('sawtooth', 0, [[0, 110], [0.3, 130], [0.7, 100]], [[0, 0], [0.1, 0.1], [0.6, 0.08], [0.75, 0]], { filter: { type: 'lowpass', freq: [[0, 400], [0.75, 300]], q: 2 }, vibrato: { rate: 5, depth: 3 } });
        break;
      case 'fox': // two quick yips
        [0, 0.14].forEach((t) => osc('sawtooth', t, [[0, 900], [0.05, 1400], [0.1, 1000]], [[0, 0], [0.01, 0.07], [0.11, 0]], { filter: { type: 'bandpass', freq: [[0, 1500], [0.1, 1500]], q: 3 } }));
        break;
      case 'penguin': // a honky squawk
        osc('square', 0, [[0, 600], [0.1, 700], [0.3, 550]], [[0, 0], [0.02, 0.05], [0.25, 0.04], [0.32, 0]], { filter: { type: 'bandpass', freq: [[0, 1200], [0.3, 1000]], q: 5 } });
        break;
      case 'pig': // oink oink
        [0, 0.2].forEach((t) => osc('sawtooth', t, [[0, 260], [0.06, 340], [0.15, 220]], [[0, 0], [0.01, 0.09], [0.15, 0]], { filter: { type: 'bandpass', freq: [[0, 700], [0.15, 500]], q: 6 } }));
        break;
      case 'frog': // ribbit
        [0, 0.12].forEach((t) => {
          for (let i = 0; i < 4; i++) osc('square', t + i * 0.02, [[0, 300], [0.015, 260]], [[0, 0], [0.002, 0.06], [0.018, 0]], { filter: { type: 'lowpass', freq: [[0, 1200], [0.02, 900]] } });
        });
        break;
      case 'panda': // munch munch and a happy hum
        bursts(0, 0.3, 8, 900, 2, 0.1, 0.03);
        osc('triangle', 0.3, [[0, 300], [0.3, 360]], [[0, 0], [0.05, 0.06], [0.35, 0]]);
        break;
      case 'dog': // a happy woof
        osc('sawtooth', 0, [[0, 300], [0.05, 420], [0.18, 240]], [[0, 0], [0.01, 0.12], [0.18, 0]], { filter: { type: 'lowpass', freq: [[0, 1600], [0.18, 700]], q: 2 }, distort: true });
        break;
      case 'raccoon': // a little chitter
        for (let i = 0; i < 6; i++) osc('square', i * 0.045, [[0, 1800 + (i % 2) * 400], [0.03, 1600]], [[0, 0], [0.004, 0.035], [0.035, 0]], { filter: { type: 'bandpass', freq: [[0, 2200], [0.03, 2000]], q: 4 } });
        break;
      case 'lion': // a big, purring rumble
        osc('sawtooth', 0, [[0, 70], [0.6, 80]], [[0, 0], [0.1, 0.1], [0.6, 0.08], [0.7, 0]], { tremolo: { rate: 24, depth: 0.05 }, filter: { type: 'lowpass', freq: [[0, 300], [0.7, 260]] } });
        break;
      case 'critic': { // a pompous "hm-HMM!" and a little fanfare
        osc('sawtooth', 0, [[0, 160], [0.12, 150]], [[0, 0], [0.02, 0.07], [0.12, 0]], { filter: { type: 'lowpass', freq: [[0, 600], [0.12, 500]] } });
        osc('sawtooth', 0.16, [[0, 150], [0.12, 220], [0.3, 200]], [[0, 0], [0.02, 0.09], [0.3, 0]], { filter: { type: 'lowpass', freq: [[0, 700], [0.3, 600]] } });
        [0, 4, 7, 12].forEach((s, i) => osc('sawtooth', 0.45 + i * 0.1, [[0, 392 * Math.pow(2, s / 12)], [0.25, 392 * Math.pow(2, s / 12)]], [[0, 0], [0.02, 0.05], [0.22, 0.04], [i === 3 ? 0.6 : 0.25, 0]], { filter: { type: 'lowpass', freq: [[0, 2400], [0.3, 1800]] }, echo: 0.3 }));
        break;
      }
    }
  },

  levelUp: () => [0, 2, 4, 5, 7].forEach((s, i) => tone(scale[s] , i * 0.1, 0.5, 'triangle', 0.12)),
};
