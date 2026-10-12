// Canvas particle layer for merge bursts, sparkles, shockwave rings and the
// cooking and serving effects (steam, bubbles, sprinkles, sparks and hearts).

import type { FoodId } from '../game/config';

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; size: number; color: string;
  kind: 'dot' | 'star' | 'ring' | 'flame' | 'drop' | 'streak' | 'ripple' | 'heart';
  spin: number; rot: number; grav: number;
  /** Frames to wait before appearing. */
  delay: number;
  /** Additive glow (default) or normal paint for solid things like hearts and sprinkles. */
  normal?: boolean;
  /** Colors a flame passes through over its life. */
  colors?: string[];
  /** Orbit around a moving center (swirls). */
  orbit?: { cx: number; cy: number; ang: number; angV: number; r: number; rV: number; rise: number };
  /** Ripple height/width ratio. */
  squash?: number;
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
    case 'heart': {
      const r = p.size * (t < 0.15 ? t / 0.15 : 1);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.beginPath();
      ctx.moveTo(0, r * 0.9);
      ctx.bezierCurveTo(-r * 1.4, -r * 0.1, -r * 0.7, -r * 1.2, 0, -r * 0.45);
      ctx.bezierCurveTo(r * 0.7, -r * 1.2, r * 1.4, -r * 0.1, 0, r * 0.9);
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(120,20,60,.6)';
      ctx.stroke();
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

/** Trail sparkles, e.g. behind items flying across the board. */
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

// ------------------------------------------------------------------ cooking and serving

const R = (a: number, b: number) => a + Math.random() * (b - a);

export const FOOD_COLORS: Record<FoodId, string[]> = {
  bakery: ['#fff2c8', '#f2c46a', '#d99a4e', '#9a5a22'],
  drinks: ['#e8f8ff', '#9ad8ff', '#4aa8f0', '#1f6fc9'],
  dessert: ['#ffe6f2', '#ff9ec8', '#ff5a9a', '#c0246a'],
  grill: ['#fff0c0', '#ffb04a', '#ff7a3c', '#c8401a'],
};

const SPRINKLES = ['#ff5a8a', '#4ac8ff', '#ffe066', '#7ee08e', '#b98cff', '#ffffff'];
const STEAM = ['rgba(255,255,255,.75)', 'rgba(255,255,255,.5)', 'rgba(255,255,255,.15)'];

/** One wisp of steam drifting up from (x, y). */
function steamPuff(x: number, y: number, k: number, delay = 0) {
  add({ x: x + R(-8, 8), y, vx: R(-0.4, 0.4), vy: R(-1.6, -0.8), kind: 'flame', normal: true, size: R(7, 12) * k, colors: STEAM, max: R(40, 60), drag: 0.99, delay });
}

/**
 * The dish being plated up at (x, y) over `ms`: steam rising off it, plus
 * bubbles (drinks), sprinkles (desserts), sparks (grill) or a dusting of
 * flour (bakery) swirling in. More of everything at higher levels.
 */
export function cookCharge(food: FoodId, x: number, y: number, level: number, ms: number) {
  const c = FOOD_COLORS[food];
  const frames = Math.max(12, Math.round((ms / 1000) * 60 * 0.75));
  const k = 0.7 + level * 0.1;
  for (let i = 0; i < 3 + level; i++) steamPuff(x, y - 8, k, Math.floor(R(0, frames * 0.8)));
  const n = 10 + level * 4;
  for (let i = 0; i < n; i++) {
    const r0 = R(26, 40) + level * 4;
    const life = Math.round(R(0.55, 0.85) * frames);
    const base = { x, y, max: life, delay: Math.floor(R(0, frames - life)),
      orbit: { cx: x, cy: y, ang: R(0, 6.28), angV: R(0.1, 0.18) * (i % 2 ? 1 : -1), r: r0, rV: -r0 / life, rise: 0 } };
    if (food === 'drinks') add({ ...base, kind: 'ring', size: R(3, 5), color: c[0] });
    else if (food === 'dessert') add({ ...base, kind: 'streak', normal: true, size: R(2, 3), color: SPRINKLES[i % SPRINKLES.length] });
    else if (food === 'grill') add({ ...base, kind: 'dot', size: R(1.5, 3), color: c[Math.floor(R(0, 3))] });
    else add({ ...base, kind: 'dot', size: R(1.5, 3), color: i % 2 ? '#ffffff' : c[0] });
  }
}

/** A few particles per frame behind a dish flying to a customer. */
export function foodTrail(food: FoodId, x: number, y: number, level: number) {
  const c = FOOD_COLORS[food];
  const k = 0.6 + level * 0.1;
  if (Math.random() < 0.35) add({ x: x + R(-6, 6), y: y + R(-6, 6), vy: R(-1.2, -0.4), kind: 'flame', normal: true, size: R(5, 9) * k, colors: STEAM, max: 26 });
  if (food === 'drinks') add({ x: x + R(-6, 6), y, vx: R(-0.6, 0.6), vy: R(-1.4, -0.2), kind: 'ring', size: R(2, 4) * k, color: c[0], max: 24 });
  else if (food === 'dessert') add({ x, y, vx: R(-1.5, 1.5), vy: R(-1, 1), kind: 'streak', normal: true, size: R(2, 3) * k, color: SPRINKLES[Math.floor(R(0, SPRINKLES.length))], max: 24, grav: 0.1 });
  else if (food === 'grill') add({ x, y, vx: R(-1.5, 1.5), vy: R(-2, 0), size: R(1.5, 2.5) * k, color: c[Math.floor(R(0, 3))], max: 22, grav: 0.05 });
  else add({ x, y, vx: R(-1, 1), vy: R(-0.5, 0.5), size: R(1.5, 3) * k, color: Math.random() < 0.5 ? '#ffffff' : c[0], max: 24 });
  if (Math.random() < 0.2) add({ x, y, kind: 'star', size: 5, color: '#fffbe0', max: 20, spin: 0.2 });
}

/**
 * A customer tasting their dish at (x, y): a pop of hearts and the dish's own
 * particles. `level` 1-7: higher levels throw more and bigger hearts, add
 * confetti and ask the caller to flash the screen.
 */
export function yum(food: FoodId, x: number, y: number, level: number): { flash: string | null } {
  const L = Math.max(1, Math.min(7, level));
  const p = 0.6 + L * 0.2;
  const c = FOOD_COLORS[food];
  add({ x, y, kind: 'ring', size: 30 * p, max: 22, color: '#fff' });
  add({ x, y, kind: 'ring', size: 46 * p, max: 30, color: c[2] });
  for (let i = 0; i < 3 + L * 2; i++) {
    const a = -Math.PI / 2 + R(-1.2, 1.2), sp = R(2, 5) * p;
    add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, kind: 'heart', normal: true, size: R(5, 9) * p, color: i % 3 ? '#ff5a8a' : '#ff9ec8', max: R(40, 60), grav: 0.06, rot: R(-0.4, 0.4), spin: R(-0.03, 0.03), drag: 0.95 });
  }
  for (let i = 0; i < 6 + L * 4; i++) {
    const a = R(0, Math.PI * 2), sp = R(2, 6) * p;
    const base = { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1, max: R(30, 50), grav: 0.15 };
    if (food === 'drinks') add({ ...base, kind: 'drop', normal: true, size: R(2, 3.5) * p, color: c[Math.floor(R(1, 4))], grav: 0.25 });
    else if (food === 'dessert') add({ ...base, kind: 'streak', normal: true, size: R(2.5, 4) * p, color: SPRINKLES[i % SPRINKLES.length] });
    else if (food === 'grill') add({ ...base, kind: 'dot', size: R(2, 4) * p, color: c[Math.floor(R(0, 3))] });
    else add({ ...base, kind: 'dot', normal: true, size: R(2, 3.5) * p, color: c[Math.floor(R(1, 4))], grav: 0.25 });
  }
  for (let i = 0; i < 2 + L; i++) steamPuff(x, y + 10, p, Math.floor(R(0, 8)));
  if (L >= 4) {
    // Confetti
    for (let i = 0; i < L * 6; i++) {
      const a = -Math.PI / 2 + R(-1.4, 1.4), sp = R(5, 10);
      add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, kind: 'streak', normal: true, size: R(3, 5), color: SPRINKLES[i % SPRINKLES.length], max: R(50, 70), grav: 0.25, drag: 0.97, delay: 4 });
    }
  }
  if (L >= 7) {
    // Finale: a nova of stars and a huge ring.
    add({ x, y, kind: 'ring', size: 200, max: 50, color: c[1], delay: 8 });
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      add({ x, y, vx: Math.cos(a) * 7, vy: Math.sin(a) * 7, kind: 'star', size: R(7, 11), color: '#fffbe0', max: 50, spin: 0.2, delay: 8 });
    }
  }
  return { flash: L >= 5 ? c[1] : null };
}
