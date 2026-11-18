import { CollatzTree } from './collatz';

const MAX_START = 1_000_000;
const WINDOW = 5000;
const PATHS_PER_FRAME = 10;
const BINS = 48;
const PADDING = 0.05;

// Magma colormap stops, sampled at even intervals.
const MAGMA = [
  '#000004', '#1c1044', '#4f127b', '#812581', '#b5367a',
  '#e55064', '#fb8761', '#fec287', '#fcfdbf',
].map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));

function magma(t: number): [number, number, number] {
  const x = Math.min(Math.max(t, 0), 1) * (MAGMA.length - 1);
  const i = Math.min(Math.floor(x), MAGMA.length - 2);
  const f = x - i;
  const [a, b] = [MAGMA[i], MAGMA[i + 1]];
  return [0, 1, 2].map((k) => Math.round(a[k] + f * (b[k] - a[k]))) as [number, number, number];
}

// Bin 0 is the rarest edge (thin, light); the last bin is the trunk (thick, black).
const binStyles = Array.from({ length: BINS }, (_, b) => {
  const t = b / (BINS - 1);
  const [r, g, bl] = magma(0.85 * (1 - t));
  return { color: `rgba(${r},${g},${bl},${0.5 + 0.5 * t})`, width: 0.4 + 7 * t };
});

const canvas = document.querySelector('canvas')!;
const ctx = canvas.getContext('2d')!;
const hud = document.getElementById('hud')!;
const tree = new CollatzTree(WINDOW);
const view = { cx: 0, cy: 0, scale: 0 };

function resize(): void {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientHeight * dpr);
}
window.addEventListener('resize', resize);
resize();

let lastTime = performance.now();
let fps = 0;

function frame(now: number): void {
  for (let i = 0; i < PATHS_PER_FRAME; i++) {
    tree.add(2 + Math.floor(Math.random() * (MAX_START - 2)));
  }

  const logMax = Math.log1p(Math.max(tree.pathCount, 1));
  const bins: number[][] = Array.from({ length: BINS }, () => []);
  let [minX, minY, maxX, maxY] = [0, 0, 0, 0];
  for (const node of tree.nodes.values()) {
    const p = node.parent;
    if (!p) continue;
    const b = Math.min(BINS - 1, Math.floor((Math.log1p(node.count) / logMax) * (BINS - 1)));
    bins[b].push(p.x, p.y, node.x, node.y);
    if (node.x < minX) minX = node.x;
    if (node.x > maxX) maxX = node.x;
    if (node.y < minY) minY = node.y;
    if (node.y > maxY) maxY = node.y;
  }

  const { width: W, height: H } = canvas;
  const target = {
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    scale: (1 - 2 * PADDING) * Math.min(W / (maxX - minX || 1), H / (maxY - minY || 1)),
  };
  const k = view.scale === 0 ? 1 : 0.05;
  view.cx += k * (target.cx - view.cx);
  view.cy += k * (target.cy - view.cy);
  view.scale += k * (target.scale - view.scale);

  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.lineCap = 'round';
  // Math coordinates have y up; the canvas has y down.
  ctx.setTransform(view.scale, 0, 0, -view.scale, W / 2 - view.scale * view.cx, H / 2 + view.scale * view.cy);
  for (let b = 0; b < BINS; b++) {
    const segs = bins[b];
    if (segs.length === 0) continue;
    ctx.beginPath();
    for (let i = 0; i < segs.length; i += 4) {
      ctx.moveTo(segs[i], segs[i + 1]);
      ctx.lineTo(segs[i + 2], segs[i + 3]);
    }
    ctx.strokeStyle = binStyles[b].color;
    ctx.lineWidth = (binStyles[b].width * dpr) / view.scale;
    ctx.stroke();
  }

  fps = 0.9 * fps + 0.1 * (1000 / (now - lastTime));
  lastTime = now;
  hud.textContent = `${tree.pathCount} paths, ${tree.nodes.size.toLocaleString()} nodes, ${fps.toFixed(0)} fps`;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
