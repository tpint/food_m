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
  levelUp: () => [0, 2, 4, 5, 7].forEach((s, i) => tone(scale[s] , i * 0.1, 0.5, 'triangle', 0.12)),
};
