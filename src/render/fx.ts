// Canvas particle layer for merge bursts, sparkles and shockwave rings.

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; size: number; color: string;
  kind: 'dot' | 'star' | 'ring';
  spin: number; rot: number; grav: number;
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

function frame() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life++;
    if (p.life >= p.max) { parts.splice(i, 1); continue; }
    const t = p.life / p.max;
    p.vy += p.grav;
    p.vx *= 0.96; p.vy *= 0.96;
    p.x += p.vx; p.y += p.vy;
    p.rot += p.spin;
    ctx.globalAlpha = Math.min(1, (1 - t) * 1.6);
    ctx.fillStyle = p.color;
    ctx.strokeStyle = p.color;
    if (p.kind === 'ring') {
      ctx.lineWidth = 6 * (1 - t) + 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.3 + t * 1.2), 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.kind === 'star') {
      star(p.x, p.y, p.size * (1 - t * 0.5), p.rot);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 - t), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  if (parts.length) requestAnimationFrame(frame);
  else { running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
}

function add(p: Partial<Particle> & Pick<Particle, 'x' | 'y'>) {
  parts.push({ vx: 0, vy: 0, life: 0, max: 40, size: 4, color: '#fff', kind: 'dot', spin: 0, rot: 0, grav: 0, ...p });
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
