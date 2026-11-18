import { CollatzTree } from './collatz';
import { addControls, type ParamSpec } from './controls';

// Values from the reference figure by Dmitry Kobak.
const DEFAULTS = {
  evenAngle: 8.65,
  oddAngle: 16,
  maxStart: 1_000_000,
  window: 5000,
  pathsPerFrame: 10,
  minWidth: 0.4,
  maxWidth: 7.4,
};
type Key = keyof typeof DEFAULTS;

const SPECS: ParamSpec<Key>[] = [
  { key: 'evenAngle', label: 'Even turn (deg)', min: 0, max: 45, step: 0.05 },
  { key: 'oddAngle', label: 'Odd turn (deg)', min: 0, max: 45, step: 0.05 },
  { key: 'maxStart', label: 'Max start', min: 10, max: 1_000_000_000, step: 1, log: true },
  { key: 'window', label: 'Paths shown', min: 100, max: 20_000, step: 100 },
  { key: 'pathsPerFrame', label: 'New paths per frame', min: 0, max: 100, step: 1 },
  { key: 'minWidth', label: 'Min line width (px)', min: 0.1, max: 5, step: 0.1 },
  { key: 'maxWidth', label: 'Max line width (px)', min: 0.5, max: 20, step: 0.1 },
];

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

const params = { ...DEFAULTS };

// Bin 0 is the rarest edge (thin, light); the last bin is the trunk (thick, black).
const binStyles = () =>
  Array.from({ length: BINS }, (_, b) => {
    const t = b / (BINS - 1);
    const [r, g, bl] = magma(0.85 * (1 - t));
    return {
      color: `rgba(${r},${g},${bl},${0.5 + 0.5 * t})`,
      width: params.minWidth + (params.maxWidth - params.minWidth) * t,
    };
  });
let styles = binStyles();

const canvas = document.querySelector('canvas')!;
const ctx = canvas.getContext('2d')!;
const hud = document.getElementById('hud')!;
const tree = new CollatzTree(params.window, params.evenAngle, params.oddAngle);
const view = { cx: 0, cy: 0, scale: 0 };
let anglesChanged = false;

const setParams = addControls(document.getElementById('params')!, SPECS, params, (key) => {
  if (key === 'evenAngle' || key === 'oddAngle') anglesChanged = true;
  else if (key === 'window') tree.setMaxPaths(params.window);
  else if (key === 'minWidth' || key === 'maxWidth') styles = binStyles();
});
document.getElementById('reset')!.addEventListener('click', () => setParams(DEFAULTS));

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
  // Rebuilding once per frame keeps slider drags responsive.
  if (anglesChanged) {
    tree.setAngles(params.evenAngle, params.oddAngle);
    anglesChanged = false;
  }
  for (let i = 0; i < params.pathsPerFrame; i++) {
    tree.add(2 + Math.floor(Math.random() * (params.maxStart - 2)));
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
    ctx.strokeStyle = styles[b].color;
    ctx.lineWidth = (styles[b].width * dpr) / view.scale;
    ctx.stroke();
  }

  fps = 0.9 * fps + 0.1 * (1000 / (now - lastTime));
  lastTime = now;
  hud.textContent = `${tree.pathCount} paths, ${tree.nodes.size.toLocaleString()} nodes, ${fps.toFixed(0)} fps`;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
