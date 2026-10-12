// Canvas particle layer for merge bursts, sparkles, shockwave rings and the
// element spell effects (fire, water, wind, earth).

import type { ElementId } from '../game/config';

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; size: number; color: string;
  kind: 'dot' | 'star' | 'ring' | 'flame' | 'drop' | 'rock' | 'streak' | 'ripple' | 'crack';
  spin: number; rot: number; grav: number;
  /** Frames to wait before appearing. */
  delay: number;
  /** Additive glow (default) or normal paint for solid things like rocks and dust. */
  normal?: boolean;
  /** Colors a flame passes through over its life. */
  colors?: string[];
  /** Orbit around a moving center (wind vortex). */
  orbit?: { cx: number; cy: number; ang: number; angV: number; r: number; rV: number; rise: number };
  /** Ripple height/width ratio, or crack path points. */
  squash?: number;
  path?: number[];
  drag?: number;
}

const canvas = document.getElementById('fx') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const parts: Particle[] = [];
let dpr = 1;
let running = false;

function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
}
addEventListener('resize', resize);
resize();

function star(x: number, y: number, r: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const rr = i % 2 ? r * 0.3 : r;
    const a = (i * Math.PI) / 4;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function lerpColor(colors: string[], t: number): string {
  const f = Math.min(colors.length - 1.001, t * (colors.length - 1));
  return colors[Math.floor(f)];
}

function draw(p: Particle, t: number) {
  ctx.fillStyle = p.color;
  ctx.strokeStyle = p.color;
  switch (p.kind) {
    case 'ring':
      ctx.lineWidth = 6 * (1 - t) + 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.3 + t * 1.2), 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'ripple': {
      const r = p.size * (0.2 + t);
      ctx.lineWidth = 4 * (1 - t) + 1;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, r, r * (p.squash ?? 0.35), 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'star':
      star(p.x, p.y, p.size * (1 - t * 0.5), p.rot);
      break;
    case 'flame': {
      // Grows quickly, then shrinks as it cools through its colors.
      const r = p.size * (t < 0.2 ? 0.5 + t * 2.5 : 1 - (t - 0.2) * 0.9);
      const c = p.colors ? lerpColor(p.colors, t) : p.color;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(0.1, r));
      g.addColorStop(0, c);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      if (!p.normal) ctx.globalAlpha *= 0.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.1, r), 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'drop': {
      const a = Math.atan2(p.vy, p.vx);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 1.6, p.size * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'rock': {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.beginPath();
      const r = p.size;
      ctx.moveTo(-r, -r * 0.4); ctx.lineTo(-r * 0.3, -r); ctx.lineTo(r * 0.8, -r * 0.6);
      ctx.lineTo(r, r * 0.3); ctx.lineTo(r * 0.2, r); ctx.lineTo(-r * 0.8, r * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(50,30,15,.8)';
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,240,220,.35)';
      ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.35, r * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      break;
    }
    case 'streak': {
      const len = p.size * 3;
      const sp = Math.hypot(p.vx, p.vy) || 1;
      ctx.lineWidth = Math.max(1, p.size * 0.5 * (1 - t));
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - (p.vx / sp) * len, p.y - (p.vy / sp) * len);
      ctx.stroke();
      break;
    }
    case 'crack': {
      const pts = p.path ?? [];
      const n = Math.max(2, Math.floor((pts.length / 2) * Math.min(1, t * 3)));
      ctx.lineWidth = p.size;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[0], pts[1]);
      for (let k = 1; k < n; k++) ctx.lineTo(pts[k * 2], pts[k * 2 + 1]);
      ctx.stroke();
      break;
    }
    default:
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.1, p.size * (1 - t)), 0, Math.PI * 2);
      ctx.fill();
  }
}

function frame() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    if (p.delay > 0) { p.delay--; continue; }
    p.life++;
    if (p.life >= p.max) { parts.splice(i, 1); continue; }
    const t = p.life / p.max;
    if (p.orbit) {
      const o = p.orbit;
      o.ang += o.angV; o.r += o.rV; o.cy += o.rise;
      const nx = o.cx + Math.cos(o.ang) * o.r, ny = o.cy + Math.sin(o.ang) * o.r * 0.45;
      p.vx = nx - p.x; p.vy = ny - p.y;
      p.x = nx; p.y = ny;
    } else {
      const d = p.drag ?? 0.96;
      p.vy += p.grav;
      p.vx *= d; p.vy *= d;
      p.x += p.vx; p.y += p.vy;
    }
    p.rot += p.spin;
    ctx.globalCompositeOperation = p.normal ? 'source-over' : 'lighter';
    ctx.globalAlpha = Math.min(1, (1 - t) * 1.6);
    draw(p, t);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  if (parts.length) requestAnimationFrame(frame);
  else { running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
}

function add(p: Partial<Particle> & Pick<Particle, 'x' | 'y'>) {
  parts.push({ vx: 0, vy: 0, life: 0, max: 40, size: 4, color: '#fff', kind: 'dot', spin: 0, rot: 0, grav: 0, delay: 0, ...p });
  if (!running) { running = true; requestAnimationFrame(frame); }
}

/** Big juicy burst used when two items merge. */
export function burst(x: number, y: number, color: string, power = 1) {
  add({ x, y, kind: 'ring', size: 34 * power, max: 26, color: '#fff' });
  add({ x, y, kind: 'ring', size: 50 * power, max: 34, color });
  const n = Math.round(18 * power);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = (2 + Math.random() * 5) * power;
    add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1, size: 3 + Math.random() * 4, color: i % 3 ? color : '#fff', max: 30 + Math.random() * 25, grav: 0.12 });
  }
  for (let i = 0; i < 6 * power; i++) {
    const a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 3;
    add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, kind: 'star', size: 6 + Math.random() * 6, color: '#fffbe0', max: 40 + Math.random() * 20, spin: (Math.random() - 0.5) * 0.3 });
  }
}

/** Small puff when an item appears. */
export function puff(x: number, y: number, color: string) {
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    add({ x, y, vx: Math.cos(a) * 2.5, vy: Math.sin(a) * 2.5, size: 3 + Math.random() * 2, color, max: 22 });
  }
}

/** Trail sparkles, e.g. behind items flying to a monster. */
export function trail(x: number, y: number, color: string) {
  add({ x: x + (Math.random() - 0.5) * 10, y: y + (Math.random() - 0.5) * 10, vy: -0.5, size: 3 + Math.random() * 3, color, max: 24 });
  if (Math.random() < 0.3) add({ x, y, kind: 'star', size: 5, color: '#fffbe0', max: 20, spin: 0.2 });
}

export function shower(x: number, y: number, colors: string[]) {
  for (let i = 0; i < 50; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, sp = 4 + Math.random() * 8;
    add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, kind: Math.random() < 0.4 ? 'star' : 'dot', size: 4 + Math.random() * 5, color: colors[i % colors.length], max: 50 + Math.random() * 30, grav: 0.22, spin: 0.2 });
  }
  add({ x, y, kind: 'ring', size: 90, max: 40, color: colors[0] });
}

// ------------------------------------------------------------------ element spells

const R = (a: number, b: number) => a + Math.random() * (b - a);

export const ELEMENT_COLORS: Record<ElementId, string[]> = {
  fire: ['#ffd36a', '#ff8a2a', '#e8461e', '#8a1e10'],
  water: ['#d8f2ff', '#7cc8f8', '#3a98e8', '#1f6fc9'],
  wind: ['#e6fff4', '#9ce8cc', '#5fd0aa', '#2fa080'],
  earth: ['#f4dcb0', '#c79056', '#8a5a2c', '#553218'],
};

/**
 * Element energy spiralling inward to (x, y) over `ms`, as the item dissolves
 * into magic. More, wider and longer streams at higher levels.
 */
export function elementCharge(el: ElementId, x: number, y: number, level: number, ms: number) {
  const c = ELEMENT_COLORS[el];
  const frames = Math.max(12, Math.round((ms / 1000) * 60 * 0.75));
  const n = 14 + level * 6;
  for (let i = 0; i < n; i++) {
    const r0 = R(28, 44) + level * 5;
    const life = Math.round(R(0.55, 0.85) * frames);
    const base = { x, y, max: life, delay: Math.floor(R(0, frames - life)), color: c[Math.floor(R(0, 3))],
      orbit: { cx: x, cy: y, ang: R(0, 6.28), angV: R(0.12, 0.22) * (i % 2 ? 1 : -1), r: r0, rV: -r0 / life, rise: 0 } };
    if (el === 'fire') add({ ...base, kind: 'flame', size: R(5, 9), colors: c });
    else if (el === 'water') add({ ...base, kind: 'drop', size: R(1.6, 3) });
    else if (el === 'wind') add({ ...base, kind: 'streak', size: R(2, 4), color: c[Math.floor(R(0, 2))] });
    else add({ ...base, kind: i % 3 ? 'dot' : 'rock', normal: i % 3 === 0, size: R(2, 4), color: c[Math.floor(R(1, 4))] });
  }
}

/** Streaks racing along a wind beam, spiralling around it at higher levels. */
export function windBeam(x1: number, y1: number, x2: number, y2: number, level: number) {
  const c = ELEMENT_COLORS.wind;
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
  const n = 30 + level * 10;
  for (let i = 0; i < n; i++) {
    const t = R(0, 0.9), side = R(-1, 1) * (8 + level * 3);
    const sp = R(9, 15);
    add({ x: x1 + dx * t + nx * side, y: y1 + dy * t + ny * side, vx: ux * sp, vy: uy * sp, kind: 'streak', size: R(3, 6), color: c[Math.floor(R(0, 3))], max: R(10, 18), drag: 1, delay: Math.floor(R(0, 14)) });
  }
  for (let i = 0; i < 8 + level * 2; i++) {
    const t = R(0, 1);
    add({ x: x1 + dx * t, y: y1 + dy * t, kind: 'ring', size: R(10, 18) + level * 2, color: '#e6fff4', max: 18, delay: Math.floor(R(0, 12)) });
  }
}

/** A few particles per frame behind an item flying toward a monster. */
export function elementTrail(el: ElementId, x: number, y: number, level: number) {
  const c = ELEMENT_COLORS[el];
  const k = 0.6 + level * 0.12;
  if (el === 'fire') {
    add({ x: x + R(-6, 6), y: y + R(-6, 6), vy: R(-1.5, -0.5), kind: 'flame', size: R(6, 11) * k, colors: c, max: 22, grav: -0.03 });
  } else if (el === 'water') {
    add({ x: x + R(-6, 6), y, vx: R(-1, 1), vy: R(-1, 0.5), kind: 'drop', normal: true, size: R(1.5, 3) * k, color: c[Math.floor(R(1, 4))], max: 26, grav: 0.2 });
  } else if (el === 'wind') {
    add({ x, y, orbit: { cx: x, cy: y, ang: R(0, 6.28), angV: 0.35, r: R(4, 10) * k, rV: 0.4, rise: 0 }, kind: 'streak', size: R(2, 4) * k, color: c[Math.floor(R(0, 3))], max: 18 });
  } else {
    add({ x: x + R(-6, 6), y: y + R(-4, 4), vx: R(-0.6, 0.6), vy: R(-0.4, 0.4), kind: 'flame', normal: true, size: R(6, 10) * k, colors: ['rgba(199,144,86,.55)', 'rgba(160,120,80,.35)', 'rgba(120,90,60,.15)'], max: 26 });
    if (Math.random() < 0.25) add({ x, y, vx: R(-1.5, 1.5), vy: R(-2, 0), kind: 'rock', normal: true, size: R(1.5, 3) * k, color: c[2], max: 28, grav: 0.25, spin: R(-0.3, 0.3) });
  }
}

/**
 * The hit effect when an element spell lands. `level` 1-7: higher levels
 * spawn more and bigger particles, stack extra layers (fire pillar, geyser,
 * tornado, ground cracks) and ask the caller to shake / flash the screen.
 */
export function elementHit(el: ElementId, x: number, y: number, level: number): { shake: number; flash: string | null } {
  const L = Math.max(1, Math.min(7, level));
  const p = 0.6 + L * 0.22;
  const c = ELEMENT_COLORS[el];
  add({ x, y, kind: 'ring', size: 30 * p, max: 22, color: '#fff' });
  add({ x, y, kind: 'ring', size: 46 * p, max: 30, color: c[2] });

  if (el === 'fire') {
    for (let i = 0; i < 10 + L * 8; i++) {
      const a = R(-Math.PI, 0), sp = R(1, 4) * p;
      add({ x: x + R(-8, 8) * p, y: y + R(-4, 8), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1, kind: 'flame', size: R(8, 16) * p, colors: c, max: R(28, 44) + L * 3, grav: -0.06, drag: 0.94 });
    }
    for (let i = 0; i < 6 + L * 5; i++) {
      add({ x, y, vx: R(-3, 3) * p, vy: R(-6, -1) * p, size: R(1.5, 3), color: i % 2 ? '#ffd27a' : '#ff8a3c', max: R(40, 70), grav: -0.02 });
    }
    if (L >= 4) {
      // Fire pillar
      for (let i = 0; i < L * 6; i++) {
        add({ x: x + R(-10, 10) * p, y: y + 20, vy: R(-7, -4) * p, kind: 'flame', size: R(10, 20) * p, colors: c, max: R(30, 45), grav: -0.05, delay: Math.floor(i * 0.8), drag: 0.97 });
      }
    }
    if (L >= 6) add({ x, y, kind: 'ring', size: 120 * p, max: 40, color: '#ffb63c', delay: 6 });
  } else if (el === 'water') {
    for (let i = 0; i < 10 + L * 8; i++) {
      const a = -Math.PI / 2 + R(-1.3, 1.3), sp = R(3, 7) * p;
      add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, kind: 'drop', normal: true, size: R(2, 4.5) * p, color: c[Math.floor(R(1, 4))], max: R(35, 55), grav: 0.28, drag: 0.98 });
    }
    for (let i = 0; i < 1 + Math.floor(L / 2); i++) {
      add({ x, y: y + 16, kind: 'ripple', size: R(36, 46) * p * (1 + i * 0.35), squash: 0.32, max: 40, color: i % 2 ? '#ffffff' : c[2], delay: i * 7 });
    }
    if (L >= 3) {
      for (let i = 0; i < L * 3; i++) {
        add({ x: x + R(-20, 20) * p, y: y + R(0, 14), vx: R(-0.4, 0.4), vy: R(-2.2, -0.8), kind: 'ring', size: R(3, 7), color: '#d8f4ff', max: R(40, 60), delay: Math.floor(R(0, 15)), drag: 0.99 });
      }
    }
    if (L >= 5) {
      // Geyser
      for (let i = 0; i < L * 8; i++) {
        add({ x: x + R(-6, 6) * p, y: y + 18, vx: R(-1.2, 1.2), vy: R(-12, -7) * p * 0.8, kind: 'drop', normal: true, size: R(2.5, 5) * p, color: c[Math.floor(R(1, 4))], max: R(40, 60), grav: 0.3, delay: Math.floor(i * 0.5), drag: 0.99 });
      }
    }
  } else if (el === 'wind') {
    for (let i = 0; i < 10 + L * 5; i++) {
      add({ x, y, kind: i % 4 ? 'streak' : 'dot', size: R(2, 4.5) * p, color: c[Math.floor(R(1, 4))], max: R(30, 50) + L * 2,
        orbit: { cx: x, cy: y + 10, ang: R(0, 6.28), angV: R(0.18, 0.32), r: R(4, 12), rV: R(0.6, 1.4) * p, rise: R(-1, -0.3) * p } });
    }
    for (let i = 0; i < 3 + L; i++) {
      const yy = y + R(-30, 30) * p;
      add({ x: x - R(60, 110), y: yy, vx: R(9, 14), vy: R(-0.5, 0.5), kind: 'streak', size: R(3, 5), color: c[0], max: R(18, 26), drag: 0.99, delay: Math.floor(R(0, 10)) });
    }
    for (let i = 0; i < 2 + Math.floor(L / 3); i++) add({ x, y, kind: 'ripple', size: 50 * p * (1 + i * 0.4), squash: 0.5, max: 34, color: c[2], delay: i * 5 });
    if (L >= 5) {
      // Tornado: stacked rings of orbiting streaks rising off the target.
      for (let i = 0; i < L * 6; i++) {
        const h = R(0, 1);
        add({ x, y, kind: 'streak', size: R(2.5, 5) * p, color: c[Math.floor(R(1, 4))], max: R(40, 60), delay: Math.floor(R(0, 12)),
          orbit: { cx: x, cy: y + 30 - h * 90 * p * 0.6, ang: R(0, 6.28), angV: R(0.3, 0.45), r: (6 + h * 34) * p * 0.6, rV: 0.15, rise: -0.6 } });
      }
    }
  } else {
    for (let i = 0; i < 6 + L * 4; i++) {
      const a = -Math.PI / 2 + R(-1.4, 1.4), sp = R(3, 7) * p;
      add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, kind: 'rock', normal: true, size: R(2.5, 5) * p, color: c[Math.floor(R(1, 3))], max: R(40, 60), grav: 0.35, spin: R(-0.3, 0.3), drag: 0.985 });
    }
    for (let i = 0; i < 8 + L * 5; i++) {
      const a = R(0, 6.28), sp = R(0.5, 2.2) * p;
      add({ x: x + R(-6, 6), y: y + R(0, 12), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5 - 0.3, kind: 'flame', normal: true, size: R(10, 18) * p, colors: ['rgba(214,180,130,.55)', 'rgba(180,140,100,.45)', 'rgba(140,110,80,.2)'], max: R(40, 60), drag: 0.95 });
    }
    if (L >= 4) {
      // Ground cracks radiating from the impact.
      for (let k = 0; k < 3 + L; k++) {
        const a = R(0, Math.PI * 2), len = R(30, 60) * p;
        const pts = [x, y + 14];
        let px = x, py = y + 14;
        for (let s = 1; s <= 6; s++) {
          px = x + Math.cos(a) * len * (s / 6) + R(-5, 5);
          py = y + 14 + Math.sin(a) * len * (s / 6) * 0.45 + R(-3, 3);
          pts.push(px, py);
        }
        add({ x, y, kind: 'crack', normal: true, path: pts, size: R(2, 3.5), color: 'rgba(60,35,15,.85)', max: 55 });
      }
    }
    if (L >= 6) {
      for (let i = 0; i < 3; i++) {
        add({ x: x + R(-20, 20), y: y - 10, vx: R(-3, 3), vy: R(-9, -6), kind: 'rock', normal: true, size: R(6, 9) * p, color: c[1], max: 60, grav: 0.4, spin: R(-0.2, 0.2), delay: 4 + i * 3 });
      }
    }
  }

  if (L >= 7) {
    // Finale: a nova of stars and a huge shockwave.
    add({ x, y, kind: 'ring', size: 200, max: 50, color: c[1], delay: 8 });
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      add({ x, y, vx: Math.cos(a) * 7, vy: Math.sin(a) * 7, kind: 'star', size: R(7, 11), color: '#fffbe0', max: 50, spin: 0.2, delay: 8 });
    }
  }
  return { shake: L >= 4 ? (L - 3) * 2.5 : 0, flash: L >= 5 ? c[2] : null };
}
