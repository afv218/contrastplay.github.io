// Unified seeded procedural baby pattern generator (pure ES module).
import { PALETTES, createRng } from './patterns.js';
import {
  GENERATIVE_FAMILIES,
  REAL_FAMILIES,
  describeProceduralCard,
  f2,
  hashSeed,
  randomSeedCode,
  renderBauhaus,
  renderMandala,
  renderTruchet,
  resolveFamilyId,
} from './procedural_core.js';
import { renderCreature, renderOpArt } from './procedural_extra.js';

export {
  GENERATIVE_FAMILIES,
  REAL_FAMILIES,
  describeProceduralCard,
  hashSeed,
  randomSeedCode,
  resolveFamilyId,
};

const SVG_NS = 'http://www.w3.org/2000/svg';

const FAMILY_RENDERERS = {
  truchet: renderTruchet,
  bauhaus: renderBauhaus,
  mandala: renderMandala,
  creature: renderCreature,
  opart: renderOpArt,
};

function resolvePalette(paletteId, invert) {
  const base = PALETTES[paletteId] || PALETTES.bwr;
  if (!invert) return { ...base };
  const newBg = base.fg;
  const newFg = base.bg;
  const newAccent = base.accent === base.fg ? newFg : base.accent;
  return { ...base, bg: newBg, fg: newFg, accent: newAccent };
}

function clampComplexity(c) {
  const n = Math.trunc(Number(c));
  if (!Number.isFinite(n)) return 3;
  return Math.max(1, Math.min(5, n));
}

export function renderProceduralSvg(options = {}) {
  const {
    seed = 'STAR-101',
    family = 'auto',
    paletteId = 'bwr',
    complexity = 3,
    invert = false,
    size = 800,
    showBorder = true,
    clipId,
  } = options;

  const info = describeProceduralCard(seed, family);
  const p = resolvePalette(paletteId, invert);
  const c = clampComplexity(complexity);
  const s = Number.isFinite(Number(size)) && Number(size) > 0 ? Number(size) : 800;
  const rng = createRng(info.seedInt);

  const rawClip = clipId
    ? String(clipId)
    : `proc-clip-${info.familyId}-${info.seedInt}-${s}`;
  const resolvedClipId = rawClip.replace(/[^a-zA-Z0-9_-]/g, '-');

  const renderer = FAMILY_RENDERERS[info.familyId] || renderTruchet;
  const body = renderer(s, p, c, rng);

  const sw = Math.max(8, s * 0.015);

  let svg = `<svg xmlns="${SVG_NS}" viewBox="0 0 ${s} ${s}" width="${s}" height="${s}" role="img" aria-label="${info.title} high-contrast baby card">`;
  svg += `\n    <defs><clipPath id="${resolvedClipId}"><rect x="0" y="0" width="${s}" height="${s}"/></clipPath></defs>`;
  svg += `\n    <g clip-path="url(#${resolvedClipId})">`;
  svg += `\n      <rect data-role="bg" x="0" y="0" width="${s}" height="${s}" fill="${p.bg}"/>`;
  svg += `\n      ${body}`;
  if (showBorder) {
    svg += `\n      <rect x="0" y="0" width="${s}" height="${s}" fill="none" stroke="${p.fg}" stroke-width="${f2(sw * 2)}"/>`;
  }
  svg += `\n    </g>`;
  svg += `\n</svg>`;
  return svg;
}
