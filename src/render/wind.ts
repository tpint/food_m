// Wind spells take a different form at every level:
// 1 sphere, 2 twin wisps, 3 wind blade, 4 arrow volley, 5 tornado,
// 6 wind laser, 7 storm lance (a thick beam wrapped in spiralling blades).
// Each returns a promise that resolves when the attack lands.

import { burst, elementTrail, windBeam } from './fx';

type Pt = { x: number; y: number };

/** Shared flight path: an arc from `from` to `to`, like the other spells. */
function arc(from: Pt, to: Pt, t: number): Pt {
  const lift = Math.min(120, Math.abs(to.y - from.y) * 0.35 + 40);
  const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  return { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e - Math.sin(Math.PI * t) * lift };
}

/** Run `frame(t)` from 0 to 1 over `ms`, then resolve. */
function animate(ms: number, frame: (t: number) => void): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      frame(t);
      if (t < 1) requestAnimationFrame(step); else resolve();
    };
    requestAnimationFrame(step);
  });
}

function sprite(svg: string, size: number, cls = ''): HTMLElement {
  const el = document.createElement('div');
  el.className = `wind-sprite ${cls}`;
  el.style.width = el.style.height = `${size}px`;
  el.style.margin = `${-size / 2}px 0 0 ${-size / 2}px`;
  el.innerHTML = svg;
  document.body.appendChild(el);
  return el;
}

const GRAD = `<defs><linearGradient id="wg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5fd0aa" stop-opacity="0"/><stop offset=".5" stop-color="#c8fff0"/><stop offset="1" stop-color="#ffffff"/></linearGradient>
  <radialGradient id="wr"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#d8fff0"/><stop offset="1" stop-color="#5fd0aa"/></radialGradient></defs>`;

const BLADE = `<svg viewBox="-50 -50 100 100">${GRAD}<path d="M0 -44A44 44 0 1 1 0 44A30 44 0 1 0 0 -44Z" fill="url(#wr)" stroke="#2fa080" stroke-width="2.5"/><path d="M6 -34A34 34 0 0 1 6 34" fill="none" stroke="#fff" stroke-width="3" opacity=".8"/></svg>`;
const ARROW = `<svg viewBox="0 -12 120 24">${GRAD}<path d="M0 0H96" stroke="url(#wg)" stroke-width="5" stroke-linecap="round"/><path d="M84 -11L120 0L84 11L92 0Z" fill="#ffffff" stroke="#2fa080" stroke-width="2"/><path d="M8 -7L30 0M8 7L30 0M24 -6L44 0M24 6L44 0" stroke="#c8fff0" stroke-width="2" opacity=".8"/></svg>`;
const TORNADO = `<svg viewBox="-50 -60 100 120">${GRAD}${[[-44, 40, 9], [-26, 33, 8], [-9, 26, 7], [7, 19, 6], [22, 13, 5], [35, 8, 4], [46, 4, 3]]
  .map(([y, rx, ry]) => `<ellipse cx="0" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#wr)" fill-opacity=".85" stroke="#2fa080" stroke-width="2"/>`).join('')}
  <path d="M-30 -40Q0 -30 30 -44M-18 -8Q0 0 18 -10M-8 22Q0 26 8 20" fill="none" stroke="#fff" stroke-width="2.4" opacity=".8"/></svg>`;

/** A spinning projectile flying along the arc, with a wind trail. */
async function flyingSprite(el: HTMLElement, from: Pt, to: Pt, ms: number, level: number, spin: number, grow = 0.3, orient = false) {
  let rot = 0;
  let prev = from;
  await animate(ms, (t) => {
    const p = arc(from, to, t);
    rot += spin;
    const ang = orient ? (Math.atan2(p.y - prev.y, p.x - prev.x) * 180) / Math.PI : rot;
    el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${ang}deg) scale(${1 + Math.sin(Math.PI * t) * grow})`;
    elementTrail('wind', p.x, p.y, level);
    prev = p;
  });
  el.remove();
}

/** A beam of wind from `from` to `to` that flares and fades. */
function beam(from: Pt, to: Pt, thickness: number, ms: number): HTMLElement {
  const el = document.createElement('div');
  el.className = 'wind-beam';
  const len = Math.hypot(to.x - from.x, to.y - from.y);
  const ang = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
  Object.assign(el.style, { width: `${len}px`, height: `${thickness}px`, marginTop: `${-thickness / 2}px`, transform: `translate(${from.x}px, ${from.y}px) rotate(${ang}deg)` });
  el.style.setProperty('--beam-ms', `${ms}ms`);
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ms + 50);
  return el;
}

/**
 * Play the wind attack for `level` from the casting circle to the monster.
 * `orb` is the wind sphere formed during the charge; forms that are not a
 * sphere absorb it at launch. Resolves when the attack hits.
 */
export async function windAttack(level: number, from: Pt, to: Pt, cell: number, orb?: HTMLElement): Promise<void> {
  const L = Math.max(1, Math.min(7, level));
  if (L <= 1 && orb) {
    // Plain sphere: the orb itself flies.
    await flyingSprite(orb, from, to, 520, L, 0, 0.25);
    return;
  }
  orb?.remove();

  if (L === 2) {
    // Twin wisps spiralling around each other.
    const s = cell * 0.5;
    const a = sprite(`<svg viewBox="-50 -50 100 100">${GRAD}<circle r="40" fill="url(#wr)"/></svg>`, s, 'glow');
    const b = sprite(`<svg viewBox="-50 -50 100 100">${GRAD}<circle r="40" fill="url(#wr)"/></svg>`, s, 'glow');
    await animate(560, (t) => {
      const p = arc(from, to, t);
      const off = Math.sin(t * Math.PI * 4) * cell * 0.35 * (1 - t * 0.6);
      a.style.transform = `translate(${p.x + off}px, ${p.y}px)`;
      b.style.transform = `translate(${p.x - off}px, ${p.y}px)`;
      elementTrail('wind', p.x + off, p.y, L);
      elementTrail('wind', p.x - off, p.y, L);
    });
    a.remove(); b.remove();
    return;
  }

  if (L === 3) {
    // A spinning crescent blade.
    await flyingSprite(sprite(BLADE, cell * 1.1, 'glow'), from, to, 480, L, 38, 0.35);
    return;
  }

  if (L === 4) {
    // A volley of three wind arrows, each landing with a puff.
    const shots = [-1, 0, 1].map((k, i) => new Promise<void>((done) => {
      setTimeout(async () => {
        const start = { x: from.x + k * cell * 0.4, y: from.y };
        const end = { x: to.x + k * cell * 0.25, y: to.y };
        await flyingSprite(sprite(ARROW, cell * 1.3, 'glow arrow'), start, end, 380, L, 0, 0, true);
        if (i < 2) burst(end.x, end.y, '#9ce8cc', 0.45);
        done();
      }, i * 110);
    }));
    await Promise.all(shots);
    return;
  }

  if (L === 5) {
    // A tornado tearing across, wobbling and growing.
    const el = sprite(TORNADO, cell * 1.6, 'glow');
    await animate(640, (t) => {
      const p = arc(from, to, t);
      const wob = Math.sin(t * 40) * 6;
      el.style.transform = `translate(${p.x + wob}px, ${p.y}px) scale(${0.7 + t * 0.6}, ${0.7 + t * 0.6}) skewX(${Math.sin(t * 30) * 8}deg)`;
      elementTrail('wind', p.x, p.y + cell * 0.4, L);
      elementTrail('wind', p.x, p.y - cell * 0.2, L);
    });
    el.remove();
    return;
  }

  // 6: wind laser. 7: storm lance, a thicker beam wrapped in spiralling blades.
  const thick = L === 6 ? cell * 0.32 : cell * 0.55;
  const ms = L === 6 ? 520 : 760;
  beam(from, to, thick, ms);
  windBeam(from.x, from.y, to.x, to.y, L);
  if (L >= 7) {
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        const bl = sprite(BLADE, cell * 0.7, 'glow');
        const dx = to.x - from.x, dy = to.y - from.y, len = Math.hypot(dx, dy);
        const nx = -dy / len, ny = dx / len;
        animate(420, (t) => {
          const r = Math.sin(t * Math.PI * 3 + i) * cell * 0.45;
          const x = from.x + dx * t + nx * r, y = from.y + dy * t + ny * r;
          bl.style.transform = `translate(${x}px, ${y}px) rotate(${t * 900}deg)`;
        }).then(() => bl.remove());
      }, i * 90);
    }
  }
  // The beam reaches the monster almost at once.
  await new Promise((r) => setTimeout(r, 140));
}
