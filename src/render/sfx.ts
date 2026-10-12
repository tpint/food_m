// Tiny WebAudio synth so the PoC has satisfying sounds without asset files.

let ac: AudioContext | null = null;
let muted = false;
try { muted = localStorage.getItem('arcane-muted') === '1'; } catch { /* ignore */ }

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

/** Filtered white noise: the base of whooshes, splashes and rumbles. */
function noise(start: number, dur: number, type: BiquadFilterType, f0: number, f1: number, vol: number) {
  if (muted) return;
  const a = ctx();
  const t = a.currentTime + start;
  const src = a.createBufferSource();
  src.buffer = noiseBuffer(a);
  src.loop = true;
  const f = a.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(f0, t);
  f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f).connect(g).connect(a.destination);
  src.start(t);
  src.stop(t + dur + 0.05);
}

// ------------------------------------------------------------------ voice toolkit
// Small building blocks for the richer sounds below (spell flights, monster
// cries). Envelopes are lists of [time, value] points relative to `start`.

type Pts = [number, number][];

function curve(param: AudioParam, t0: number, pts: Pts, exp = false) {
  param.setValueAtTime(Math.max(exp ? 0.0001 : 0, pts[0][1]), t0 + pts[0][0]);
  for (const [t, v] of pts.slice(1)) {
    if (exp) param.exponentialRampToValueAtTime(Math.max(0.0001, v), t0 + t);
    else param.linearRampToValueAtTime(v, t0 + t);
  }
}

let echoIn: AudioNode | null = null;

/** Shared echo for the bigger monsters: delay with filtered feedback. */
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

/** Soft distortion for growls and roars. */
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

/** Short random clicks/bursts spread over a time span (crackle, gravel, splashes). */
function bursts(start: number, span: number, n: number, f: number, q: number, vol: number, len = 0.02) {
  for (let i = 0; i < n; i++) {
    const t = start + Math.random() * span;
    hiss(t, [[0, 0], [0.003, vol * rnd(0.5, 1)], [len, 0]], { type: 'bandpass', freq: [[0, f * rnd(0.7, 1.4)], [len, f]], q });
  }
}

const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];

export const sfx = {
  get muted() { return muted; },
  toggle() {
    muted = !muted;
    try { localStorage.setItem('arcane-muted', muted ? '1' : '0'); } catch { /* ignore */ }
    return muted;
  },
  pick: () => tone(660, 0, 0.06, 'triangle', 0.08),
  drop: () => tone(330, 0, 0.08, 'triangle', 0.08),
  spawn: () => { tone(440, 0, 0.12, 'sine', 0.12, 1.8); tone(880, 0.05, 0.08, 'triangle', 0.05); },
  merge(level: number) {
    const base = Math.min(level - 1, 4);
    [0, 2, 4].forEach((s, i) => tone(scale[base + s] ?? scale[7], i * 0.06, 0.25, 'triangle', 0.12));
    tone(scale[base] * 2, 0.18, 0.4, 'sine', 0.06);
  },
  coin: () => { tone(1318, 0, 0.08, 'square', 0.04); tone(1760, 0.07, 0.18, 'square', 0.04); },
  error: () => tone(160, 0, 0.18, 'sawtooth', 0.06, 0.7),
  cast: () => { tone(300, 0, 0.5, 'sawtooth', 0.05, 4); tone(600, 0.1, 0.4, 'triangle', 0.08, 2.5); },
  defeat: () => [0, 2, 4, 7].forEach((s, i) => tone(scale[s % 8] * (s >= 7 ? 2 : 1), i * 0.08, 0.35, 'triangle', 0.1)),
  /**
   * The arcane circle drawing itself while magic is pulled out of an item:
   * a low uneasy drone, a breath being drawn up through a resonant filter,
   * glassy pings in an exotic scale as the strokes land, and a last inhale
   * before the spell flies. Each element has its own root; higher levels are
   * fuller, with more pings.
   */
  charge(level: number, ms: number, el?: 'earth' | 'water' | 'wind' | 'fire') {
    const d = ms / 1000;
    const root = el ? { earth: 73.4, water: 98, wind: 110, fire: 82.4 }[el] : 92.5;
    const v = 0.028 + level * 0.0035;
    // Drone: the root and a slightly sour tritone above it, slowly swelling.
    osc('sine', 0, [[0, root], [d, root * 1.06]], [[0, 0], [d * 0.6, v], [d, v * 1.2], [d + 0.2, 0]],
      { tremolo: { rate: 4 + level * 0.6, depth: v * 0.35 }, echo: 0.2 });
    osc('triangle', 0.03, [[0, root * Math.SQRT2 * 1.004], [d, root * Math.SQRT2 * 1.09]], [[0, 0], [d * 0.7, v * 0.45], [d + 0.15, 0]],
      { filter: { type: 'lowpass', freq: [[0, 300], [d, 1400 + level * 120]] } });
    // Power being drawn out: breathy noise rising through a resonant band.
    hiss(0, [[0, 0], [d * 0.8, 0.022 + level * 0.003], [d, 0.04], [d + 0.08, 0]],
      { type: 'bandpass', freq: [[0, 260], [d, 2200 + level * 300]], q: 7 }, { echo: 0.25 });
    // Glassy pings in a Hijaz-like scale, one per stroke of the circle.
    const steps = [0, 1, 4, 5, 7, 8, 11, 12];
    const n = 2 + level;
    for (let i = 0; i < n; i++) {
      const f = root * 8 * Math.pow(2, steps[(i * 3 + level) % steps.length] / 12);
      osc('sine', (i / n) * d * 0.9, [[0, f], [0.7, f * 0.996]], [[0, 0], [0.008, 0.02], [0.7, 0]],
        { vibrato: { rate: 5.5, depth: f * 0.004 }, echo: 0.5 });
    }
    // The last inhale as the magic leaves the item.
    hiss(d * 0.72, [[0, 0], [d * 0.28, 0.03 + level * 0.003], [d * 0.28 + 0.04, 0]],
      { type: 'highpass', freq: [[0, 700], [d * 0.28, 5200]] });
  },
  /** Element hit sounds; higher levels are louder and longer. */
  element(el: 'earth' | 'water' | 'wind' | 'fire', level: number) {
    const k = 0.6 + level * 0.12, d = 0.25 + level * 0.07;
    if (el === 'fire') { noise(0, d * 1.4, 'lowpass', 2400, 300, 0.12 * k); tone(110, 0, d, 'sawtooth', 0.04 * k, 0.5); }
    else if (el === 'water') { noise(0, d, 'bandpass', 3000, 700, 0.12 * k); tone(700, 0.02, 0.15, 'sine', 0.08, 0.4); tone(500, 0.12, 0.12, 'sine', 0.06, 0.5); }
    else if (el === 'wind') { noise(0, d * 1.6, 'bandpass', 500, 2600, 0.1 * k); tone(900, 0, d, 'sine', 0.03, 1.6); }
    else { noise(0, d * 1.2, 'lowpass', 600, 80, 0.18 * k); tone(70, 0, d, 'sine', 0.2 * k, 0.6); }
  },
  /**
   * The sound of a spell swooping through the air for `dur` seconds. It
   * swells as it approaches (a little doppler rise) and each element has its
   * own texture; higher levels are louder, fuller and add layers.
   */
  spellFly(el: 'earth' | 'water' | 'wind' | 'fire', level: number, dur: number) {
    const k = 0.55 + level * 0.09;
    const d = dur, peak = d * 0.75;
    const swell: Pts = [[0, 0], [peak, 1], [d + 0.08, 0]];
    const env = (v: number): Pts => swell.map(([t, x]) => [t, x * v * k]);
    if (el === 'fire') {
      // Roaring whoosh plus ember crackle; big fires add a low rumble.
      hiss(0, env(0.22), { type: 'lowpass', freq: [[0, 500], [peak, 3200], [d + 0.08, 900]], q: 0.8 });
      hiss(0, env(0.08), { type: 'bandpass', freq: [[0, 1200], [peak, 2400], [d + 0.08, 1500]], q: 2 });
      bursts(0, d, 6 + level * 3, 3800, 6, 0.09 * k, 0.012);
      if (level >= 4) osc('sawtooth', 0, [[0, 60], [peak, 85], [d, 55]], env(0.05), { filter: { type: 'lowpass', freq: [[0, 180], [d, 260]] } });
    } else if (el === 'water') {
      // Rushing water and rising bubbles.
      hiss(0, env(0.18), { type: 'bandpass', freq: [[0, 700], [peak, 2200], [d + 0.08, 1100]], q: 1.2 });
      hiss(0, env(0.06), { type: 'highpass', freq: [[0, 3000], [d, 5000]], q: 0.7 });
      for (let i = 0; i < 3 + level * 2; i++) {
        const t = Math.random() * d, f = rnd(260, 520);
        osc('sine', t, [[0, f], [0.05, f * rnd(2, 3)]], [[0, 0], [0.008, 0.07 * k], [0.06, 0]]);
      }
      if (level >= 5) hiss(0, env(0.1), { type: 'lowpass', freq: [[0, 300], [peak, 900], [d + 0.08, 400]] });
    } else if (el === 'wind') {
      // Airy rush with a whistling tone that bends upward; gusts at higher levels.
      hiss(0, env(0.34), { type: 'bandpass', freq: [[0, 500], [peak, 1800], [d + 0.08, 900]], q: 3 });
      osc('sine', 0, [[0, 700], [peak, 1500], [d + 0.08, 1100]], env(0.055), { vibrato: { rate: 7, depth: 25 } });
      if (level >= 3) osc('sine', 0.05, [[0, 1050], [peak, 2200], [d + 0.08, 1600]], env(0.018), { vibrato: { rate: 9, depth: 40 } });
      if (level >= 5) hiss(0, env(0.12), { type: 'bandpass', freq: [[0, 200], [peak * 0.5, 900], [d + 0.08, 300]], q: 1.5 }, { tremolo: { rate: 6, depth: 0.08 } });
    } else {
      // Heavy, low whoosh with gravel; big boulders add a deep sub.
      hiss(0, env(0.3), { type: 'lowpass', freq: [[0, 180], [peak, 800], [d + 0.08, 250]], q: 1 });
      bursts(0, d, 4 + level * 2, 450, 3, 0.14 * k, 0.03);
      osc('sine', 0, [[0, 70], [peak, 95], [d + 0.08, 55]], env(0.12));
      if (level >= 5) osc('triangle', 0, [[0, 42], [d, 36]], env(0.1));
    }
  },

  /** The sound of an element attack; each level's form has its own voice. */
  attack(el: 'earth' | 'water' | 'wind' | 'fire', level: number) {
    if (el === 'wind') return sfx.windAttack(level);
    const k = 0.6 + level * 0.08;
    if (level <= 1) return sfx.spellFly(el, level, 0.52);
    if (el === 'fire') {
      if (level === 2) { for (let i = 0; i < 3; i++) hiss(i * 0.06, [[0, 0], [0.04, 0.16 * k], [0.4, 0]], { type: 'bandpass', freq: [[0, 900], [0.4, 2600]], q: 2 }); bursts(0, 0.5, 10, 3800, 6, 0.08, 0.012); return; }
      if (level === 3) { sfx.spellFly('fire', level, 0.5); hiss(0, [[0, 0], [0.1, 0.14 * k], [0.5, 0]], { type: 'lowpass', freq: [[0, 600], [0.5, 1400]] }, { tremolo: { rate: 14, depth: 0.08 } }); return; }
      if (level === 4) { // three falling whistles, each ending in a thump
        for (let i = 0; i < 3; i++) {
          const t = i * 0.13;
          osc('sine', t, [[0, 1800], [0.42, 500]], [[0, 0], [0.05, 0.05 * k], [0.42, 0]]);
          hiss(t, [[0, 0], [0.3, 0.14 * k], [0.45, 0]], { type: 'lowpass', freq: [[0, 400], [0.42, 2400]] });
          osc('sine', t + 0.42, [[0, 90], [0.2, 45]], [[0, 0], [0.01, 0.2], [0.22, 0]]);
        }
        return;
      }
      if (level === 5) { // a fiery whoosh and a phoenix screech
        sfx.spellFly('fire', level, 0.64);
        osc('sawtooth', 0.08, [[0, 1500], [0.15, 2300], [0.5, 1100]], [[0, 0], [0.04, 0.06], [0.3, 0.05], [0.5, 0]], { vibrato: { rate: 18, depth: 90 }, filter: { type: 'bandpass', freq: [[0, 2000], [0.5, 1400]], q: 3 }, echo: 0.3 });
        return;
      }
      if (level === 6) { // a roaring flamethrower
        hiss(0, [[0, 0], [0.05, 0.3 * k], [0.55, 0.26 * k], [0.7, 0]], { type: 'lowpass', freq: [[0, 900], [0.1, 3000], [0.7, 1200]], q: 0.8 }, { tremolo: { rate: 11, depth: 0.08 } });
        bursts(0, 0.65, 24, 3600, 6, 0.08, 0.012);
        osc('sawtooth', 0, [[0, 70], [0.7, 60]], [[0, 0], [0.05, 0.05], [0.7, 0]], { filter: { type: 'lowpass', freq: [[0, 200], [0.7, 200]] } });
        return;
      }
      // sunfall: a swelling drone into a roar
      osc('sawtooth', 0, [[0, 80], [0.76, 160]], [[0, 0], [0.5, 0.08], [0.78, 0]], { filter: { type: 'lowpass', freq: [[0, 300], [0.76, 1200]] }, echo: 0.4 });
      osc('sine', 0, [[0, 440], [0.76, 880]], [[0, 0], [0.5, 0.04], [0.78, 0]], { vibrato: { rate: 6, depth: 12 } });
      hiss(0, [[0, 0], [0.6, 0.3 * k], [0.8, 0]], { type: 'lowpass', freq: [[0, 400], [0.78, 3000]] });
      bursts(0.2, 0.6, 18, 3800, 6, 0.08, 0.012);
      return;
    }
    if (el === 'water') {
      if (level === 2) { for (let i = 0; i < 5; i++) { const t = i * 0.07 + 0.42, f = rnd(300, 600); osc('sine', t, [[0, f], [0.06, f * 2.6]], [[0, 0], [0.008, 0.1], [0.07, 0]]); } sfx.spellFly('water', 1, 0.45); return; }
      if (level === 3) { sfx.spellFly('water', level, 0.47); osc('sine', 0, [[0, 2400], [0.4, 2300]], [[0, 0], [0.01, 0.05], [0.45, 0]]); osc('sine', 0.02, [[0, 3600], [0.3, 3500]], [[0, 0], [0.01, 0.03], [0.35, 0]]); return; }
      if (level === 4) { // crystalline launches
        for (let i = 0; i < 3; i++) {
          const t = i * 0.1;
          osc('sine', t, [[0, 2800 + i * 300], [0.2, 2600]], [[0, 0], [0.005, 0.06], [0.25, 0]], { echo: 0.15 });
          hiss(t, [[0, 0], [0.01, 0.1 * k], [0.32, 0]], { type: 'bandpass', freq: [[0, 2000], [0.32, 4500]], q: 4 });
        }
        return;
      }
      if (level === 5) { // rushing water and a hissing serpent
        hiss(0, [[0, 0], [0.15, 0.2 * k], [0.6, 0.2 * k], [0.72, 0]], { type: 'bandpass', freq: [[0, 600], [0.35, 1800], [0.72, 900]], q: 1.2 }, { tremolo: { rate: 7, depth: 0.08 } });
        hiss(0.1, [[0, 0], [0.05, 0.06], [0.4, 0.06], [0.5, 0]], { type: 'highpass', freq: [[0, 5000], [0.5, 6000]] });
        for (let i = 0; i < 8; i++) { const t = rnd(0, 0.7), f = rnd(260, 520); osc('sine', t, [[0, f], [0.05, f * 2.5]], [[0, 0], [0.008, 0.06], [0.06, 0]]); }
        return;
      }
      if (level === 6) { // pressurised jet
        osc('sine', 0, [[0, 600], [0.12, 1800]], [[0, 0], [0.02, 0.05], [0.14, 0]]);
        hiss(0.1, [[0, 0], [0.03, 0.28 * k], [0.55, 0.22 * k], [0.65, 0]], { type: 'bandpass', freq: [[0, 2500], [0.6, 1500]], q: 0.8 });
        hiss(0.1, [[0, 0], [0.03, 0.1], [0.6, 0]], { type: 'lowpass', freq: [[0, 500], [0.6, 400]] });
        return;
      }
      // tidal wave: a huge swelling surge
      hiss(0, [[0, 0], [0.6, 0.4 * k], [0.9, 0.2], [1.1, 0]], { type: 'lowpass', freq: [[0, 200], [0.7, 1600], [1.1, 500]], q: 0.9 }, { echo: 0.3 });
      hiss(0.3, [[0, 0], [0.4, 0.12], [0.7, 0]], { type: 'highpass', freq: [[0, 3000], [0.7, 5000]] });
      osc('sine', 0, [[0, 50], [0.78, 80]], [[0, 0], [0.6, 0.2], [0.85, 0]]);
      return;
    }
    // earth
    if (level === 2) { sfx.spellFly('earth', 2, 0.48); sfx.spellFly('earth', 1, 0.44); return; }
    if (level === 3) { sfx.spellFly('earth', level, 0.52); bursts(0, 0.5, 12, 300, 3, 0.1, 0.04); return; }
    if (level === 4) { // crunch, crunch, crunch: spikes punching up
      for (let i = 0; i < 6; i++) {
        const t = i * 0.055 + 0.04;
        hiss(t, [[0, 0], [0.005, 0.25 * k], [0.12, 0]], { type: 'lowpass', freq: [[0, 1800], [0.12, 300]] });
        osc('sine', t, [[0, 140 - i * 8], [0.1, 60]], [[0, 0], [0.005, 0.15], [0.12, 0]]);
      }
      return;
    }
    if (level === 5) { // heavy swing and a growl
      sfx.spellFly('earth', level, 0.56);
      osc('sawtooth', 0, [[0, 70], [0.5, 55]], [[0, 0], [0.1, 0.08], [0.55, 0]], { distort: true, filter: { type: 'lowpass', freq: [[0, 400], [0.5, 300]] } });
      return;
    }
    if (level === 6) { // rumble along the ground, then a crystal chime
      hiss(0, [[0, 0], [0.1, 0.3 * k], [0.32, 0.3 * k], [0.4, 0]], { type: 'lowpass', freq: [[0, 120], [0.4, 300]] }, { tremolo: { rate: 20, depth: 0.1 } });
      osc('sine', 0, [[0, 45], [0.4, 60]], [[0, 0], [0.1, 0.2], [0.4, 0]]);
      [1568, 2093, 2637].forEach((f, i) => osc('sine', 0.34 + i * 0.03, [[0, f], [0.5, f]], [[0, 0], [0.01, 0.05], [0.6, 0]], { echo: 0.3 }));
      return;
    }
    // meteor: a falling roar into the impact
    osc('sine', 0, [[0, 1400], [0.7, 300]], [[0, 0], [0.1, 0.05], [0.7, 0]]);
    hiss(0, [[0, 0], [0.6, 0.35 * k], [0.72, 0]], { type: 'lowpass', freq: [[0, 300], [0.7, 2600]] });
    bursts(0.1, 0.6, 16, 3500, 6, 0.07, 0.012);
    osc('sine', 0.3, [[0, 50], [0.4, 40]], [[0, 0], [0.35, 0.18], [0.45, 0]]);
  },

  /** Each wind level attacks differently, so each gets its own sound. */
  windAttack(level: number) {
    const k = 0.6 + level * 0.08;
    if (level <= 2) { sfx.spellFly('wind', level, 0.54); if (level === 2) sfx.spellFly('wind', 1, 0.5); return; }
    if (level === 3) { // whoosh with a metallic "shing" as the blade spins
      sfx.spellFly('wind', level, 0.48);
      osc('triangle', 0, [[0, 3200], [0.35, 1500]], [[0, 0], [0.01, 0.06 * k], [0.4, 0]], { vibrato: { rate: 28, depth: 120 } });
      osc('sine', 0.02, [[0, 4800], [0.3, 2600]], [[0, 0], [0.01, 0.04], [0.32, 0]]);
      return;
    }
    if (level === 4) { // three bow-twang thwips
      for (let i = 0; i < 3; i++) {
        const t = i * 0.11;
        osc('triangle', t, [[0, 220], [0.08, 140]], [[0, 0], [0.005, 0.12], [0.12, 0]]);
        hiss(t, [[0, 0], [0.01, 0.12 * k], [0.3, 0]], { type: 'bandpass', freq: [[0, 1800], [0.3, 4000]], q: 4 });
      }
      return;
    }
    if (level === 5) { // a roaring, swirling funnel
      hiss(0, [[0, 0], [0.2, 0.3 * k], [0.6, 0.25 * k], [0.75, 0]], { type: 'bandpass', freq: [[0, 300], [0.4, 900], [0.75, 500]], q: 2 }, { tremolo: { rate: 9, depth: 0.1 } });
      osc('sine', 0, [[0, 90], [0.7, 130]], [[0, 0], [0.2, 0.12], [0.75, 0]], { vibrato: { rate: 9, depth: 10 } });
      return;
    }
    // 6-7: rising whine, then a bright humming beam
    const len = level === 6 ? 0.55 : 0.8;
    osc('sine', 0, [[0, 700], [0.12, 2600]], [[0, 0], [0.02, 0.08], [0.14, 0.04], [0.16, 0]]);
    osc('sawtooth', 0.12, [[0, 330], [len, level === 7 ? 220 : 290]], [[0, 0], [0.03, 0.06 * k], [len - 0.1, 0.05 * k], [len, 0]], { filter: { type: 'bandpass', freq: [[0, 1600], [len, 900]], q: 3 }, echo: level === 7 ? 0.5 : 0.2 });
    hiss(0.12, [[0, 0], [0.03, 0.2 * k], [len, 0]], { type: 'highpass', freq: [[0, 2500], [len, 1500]] });
    if (level === 7) osc('sine', 0.12, [[0, 55], [len, 45]], [[0, 0], [0.05, 0.25], [len, 0]]);
  },

  /** A monster's parting cry. Tougher monsters get echo, distortion and bass. */
  monsterCry(kind: 'slime' | 'bat' | 'ghost' | 'mushroom' | 'imp' | 'golem' | 'dragon') {
    switch (kind) {
      case 'slime': // wet, wobbly bloop falling away
        osc('triangle', 0, [[0, 420], [0.45, 110]], [[0, 0], [0.02, 0.16], [0.4, 0.08], [0.5, 0]], { vibrato: { rate: 16, depth: 40 } });
        osc('sine', 0.12, [[0, 300], [0.25, 140]], [[0, 0], [0.02, 0.1], [0.28, 0]]);
        hiss(0, [[0, 0], [0.02, 0.08], [0.3, 0]], { type: 'lowpass', freq: [[0, 900], [0.3, 200]] });
        break;
      case 'bat': // three falling squeaks with wing flutter
        [0, 0.11, 0.22].forEach((t, i) => osc('sine', t, [[0, 2600 - i * 200], [0.09 + i * 0.08, 1500 - i * 300]], [[0, 0], [0.01, 0.1], [0.1 + i * 0.08, 0]], { vibrato: { rate: 40, depth: 80 } }));
        hiss(0, [[0, 0], [0.05, 0.06], [0.45, 0]], { type: 'bandpass', freq: [[0, 800], [0.45, 500]], q: 2 }, { tremolo: { rate: 22, depth: 0.05 } });
        break;
      case 'mushroom': // a grumpy "hmmph" and a puff of spores
        osc('sawtooth', 0, [[0, 210], [0.12, 230], [0.45, 105]], [[0, 0], [0.03, 0.12], [0.35, 0.08], [0.5, 0]], { filter: { type: 'bandpass', freq: [[0, 700], [0.5, 450]], q: 3 } });
        hiss(0.32, [[0, 0], [0.02, 0.14], [0.3, 0]], { type: 'highpass', freq: [[0, 1500], [0.3, 3000]] });
        break;
      case 'ghost': // tier 2: eerie rising-then-fading wail with echo
        osc('sine', 0, [[0, 420], [0.35, 760], [1.0, 260]], [[0, 0], [0.15, 0.12], [0.7, 0.1], [1.05, 0]], { vibrato: { rate: 5.5, depth: 22 }, echo: 0.8 });
        osc('sine', 0.05, [[0, 630], [0.4, 1140], [1.0, 390]], [[0, 0], [0.2, 0.04], [1.0, 0]], { vibrato: { rate: 6.3, depth: 30 }, echo: 0.6 });
        hiss(0, [[0, 0], [0.3, 0.05], [1.0, 0]], { type: 'bandpass', freq: [[0, 1200], [1.0, 600]], q: 4 }, { echo: 0.5 });
        break;
      case 'imp': // tier 3: devilish cackle and a fiery hiss
        for (let i = 0; i < 5; i++) {
          const t = i * 0.09, f = 300 + i * 40;
          osc('sawtooth', t, [[0, f], [0.07, f * 1.25]], [[0, 0], [0.01, 0.18], [0.07, 0]], { filter: { type: 'bandpass', freq: [[0, 1100], [0.07, 900]], q: 4 }, distort: true, echo: 0.4 });
        }
        hiss(0.4, [[0, 0], [0.05, 0.2], [0.6, 0]], { type: 'lowpass', freq: [[0, 3500], [0.6, 600]] }, { echo: 0.5 });
        bursts(0.4, 0.5, 10, 3500, 6, 0.08, 0.012);
        break;
      case 'golem': // tier 4: deep stone groan, crumble and a low thud
        osc('sawtooth', 0, [[0, 85], [0.3, 95], [1.1, 42]], [[0, 0], [0.1, 0.16], [0.8, 0.12], [1.15, 0]], { filter: { type: 'lowpass', freq: [[0, 420], [1.15, 180]], q: 4 }, distort: true, echo: 0.5 });
        osc('sine', 0.6, [[0, 60], [0.4, 32]], [[0, 0], [0.02, 0.35], [0.5, 0]]);
        hiss(0.5, [[0, 0], [0.05, 0.2], [0.9, 0]], { type: 'lowpass', freq: [[0, 700], [0.9, 150]] }, { echo: 0.4 });
        bursts(0.55, 0.8, 16, 600, 3, 0.16, 0.035);
        break;
      case 'dragon': { // boss: layered, distorted roar sweeping open, deep sub and a long echo
        const g: Pts = [[0, 0], [0.12, 0.13], [0.9, 0.12], [1.5, 0]];
        const sweep = { type: 'bandpass' as BiquadFilterType, freq: [[0, 380], [0.5, 1400], [1.5, 300]] as Pts, q: 2.5 };
        osc('sawtooth', 0, [[0, 110], [0.4, 150], [1.5, 70]], g, { filter: sweep, distort: true, echo: 0.9, vibrato: { rate: 9, depth: 6 } });
        osc('sawtooth', 0, [[0, 164], [0.4, 222], [1.5, 104]], g.map(([t, v]) => [t, v * 0.7]), { filter: sweep, distort: true, echo: 0.7 });
        hiss(0, [[0, 0], [0.1, 0.22], [1.0, 0.15], [1.5, 0]], { type: 'lowpass', freq: [[0, 800], [0.5, 2600], [1.5, 400]] }, { echo: 0.6 });
        osc('sine', 0, [[0, 52], [1.5, 38]], [[0, 0], [0.1, 0.3], [1.2, 0.25], [1.55, 0]]);
        break;
      }
    }
  },

  levelUp: () => [0, 2, 4, 5, 7].forEach((s, i) => tone(scale[s] , i * 0.1, 0.5, 'triangle', 0.12)),
};
