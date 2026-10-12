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

/** Filtered white noise: the base of whooshes, splashes and rumbles. */
function noise(start: number, dur: number, type: BiquadFilterType, f0: number, f1: number, vol: number) {
  if (muted) return;
  const a = ctx();
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, a.sampleRate, a.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = a.currentTime + start;
  const src = a.createBufferSource();
  src.buffer = noiseBuf;
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
  /** Element hit sounds; higher levels are louder and longer. */
  element(el: 'earth' | 'water' | 'wind' | 'fire', level: number) {
    const k = 0.6 + level * 0.12, d = 0.25 + level * 0.07;
    if (el === 'fire') { noise(0, d * 1.4, 'lowpass', 2400, 300, 0.12 * k); tone(110, 0, d, 'sawtooth', 0.04 * k, 0.5); }
    else if (el === 'water') { noise(0, d, 'bandpass', 3000, 700, 0.12 * k); tone(700, 0.02, 0.15, 'sine', 0.08, 0.4); tone(500, 0.12, 0.12, 'sine', 0.06, 0.5); }
    else if (el === 'wind') { noise(0, d * 1.6, 'bandpass', 500, 2600, 0.1 * k); tone(900, 0, d, 'sine', 0.03, 1.6); }
    else { noise(0, d * 1.2, 'lowpass', 600, 80, 0.18 * k); tone(70, 0, d, 'sine', 0.2 * k, 0.6); }
  },
  levelUp: () => [0, 2, 4, 5, 7].forEach((s, i) => tone(scale[s] , i * 0.1, 0.5, 'triangle', 0.12)),
};
