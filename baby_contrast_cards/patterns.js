// baby_contrast_cards/patterns.js
// Zero-dependency ES module for high-contrast infant visual-stimulation cards.
// Strictly uses black, white, and vibrant red (#000000, #FFFFFF, #D91E18).

const SVG_NS = 'http://www.w3.org/2000/svg';

export const PALETTES = {
  bw: { id: 'bw', name: 'Black & White', ageHint: '0–2 mo', bg: '#FFFFFF', fg: '#000000', accent: '#000000' },
  bwr: { id: 'bwr', name: 'Black, White & Red', ageHint: '2–4+ mo', bg: '#FFFFFF', fg: '#000000', accent: '#D91E18' },
  rw: { id: 'rw', name: 'Red & White', ageHint: 'High Focus', bg: '#FFFFFF', fg: '#D91E18', accent: '#000000' },
  bwr_dark: { id: 'bwr_dark', name: 'Dark + Red', ageHint: 'Night Mode', bg: '#000000', fg: '#FFFFFF', accent: '#D91E18' },
};

export const PATTERNS = [
  { id: 'bullseye', name: 'Bullseye Rings', category: 'Geometric', description: 'Alternating high-contrast target rings.' },
  { id: 'checkerboard', name: 'Bold Checkerboard', category: 'Geometric', description: 'Crisp checkerboard grid with focal squares.' },
  { id: 'sunburst', name: 'Sunburst Rays', category: 'Geometric', description: 'Radiating high-contrast sunburst wedges.' },
  { id: 'spiral', name: 'Hypnotic Spiral', category: 'Optical', description: 'Bold continuous spiral with focal center.' },
  { id: 'polka', name: 'Polka Dots', category: 'Geometric', description: 'Large rhythmic high-contrast circles.' },
  { id: 'chevron', name: 'Chevron Zig-Zag', category: 'Stripes', description: 'Crisp zig-zag bands with strong contrast.' },
  { id: 'waves', name: 'Wavy Ribbons', category: 'Stripes', description: 'Smooth high-contrast horizontal waves.' },
  { id: 'diamonds', name: 'Nested Diamonds', category: 'Optical', description: 'Concentric rotated-square diamonds.' },
  { id: 'face', name: 'Friendly Face', category: 'Newborn Favorite', description: 'Schematic smiling face with bold eyes and rosy cheeks.' },
  { id: 'owl', name: 'Curious Owl', category: 'Newborn Favorite', description: 'Cute owl with concentric target eyes and scalloped belly.' },
];

// Deterministic Mulberry32 PRNG returning floats in [0, 1).
export function createRng(seed) {
  let a = ((Number(seed) >>> 0) + 0x9e3779b9) >>> 0;
  if (a === 0) a = 0x1234567;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clampComplexity(c) {
  let n = Math.trunc(Number(c));
  if (!Number.isFinite(n)) n = 3;
  return Math.max(1, Math.min(5, n));
}

function resolvePalette(paletteId) {
  return PALETTES[paletteId] || PALETTES.bwr;
}

function applyInvert(palette, invert) {
  if (!invert) return { ...palette };
  const { bg, fg, accent } = palette;
  const newBg = fg;
  const newFg = bg;
  const newAccent = accent === fg ? newFg : accent;
  return { ...palette, bg: newBg, fg: newFg, accent: newAccent };
}

function hasDistinctAccent(p) {
  return p.accent !== p.fg && p.accent !== p.bg;
}

function num(n) {
  return Number(n).toFixed(2);
}

function svgHeader(size, label) {
  return `<svg xmlns="${SVG_NS}" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${label}">`;
}

function borderRect(size, color) {
  const sw = Math.max(8, size * 0.015);
  const inset = sw / 2;
  return `<rect x="${num(inset)}" y="${num(inset)}" width="${num(size - sw)}" height="${num(size - sw)}" fill="none" stroke="${color}" stroke-width="${num(sw)}"/>`;
}

function clipPath(size, id) {
  return `<defs><clipPath id="${id}"><rect x="0" y="0" width="${size}" height="${size}"/></clipPath></defs>`;
}

function renderBullseye(size, p, complexity, rng) {
  const cx = size / 2;
  const cy = size / 2;
  const rings = 4 + complexity * 2;
  const maxR = size * 0.48;
  const step = maxR / rings;
  const accentMode = rng() > 0.5 ? 'center' : 'bands';
  const parts = [];

  for (let i = rings - 1; i >= 0; i--) {
    const r = step * (i + 1);
    let fill;
    if (i % 2 === 1) {
      fill = p.bg;
    } else if (hasDistinctAccent(p) && (i === 0 || (accentMode === 'bands' && i % 4 === 0))) {
      fill = p.accent;
    } else {
      fill = p.fg;
    }
    parts.push(`<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(r)}" fill="${fill}"/>`);
  }
  return parts.join('\n      ');
}

function renderCheckerboard(size, p, complexity, rng) {
  const cols = 3 + complexity;
  const cell = size / cols;
  const accentOffset = Math.floor(rng() * 3);
  const parts = [];

  for (let r = 0; r < cols; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 2 === 0) continue;
      const x = c * cell;
      const y = r * cell;
      const isCenter = r === Math.floor(cols / 2) && c === Math.floor(cols / 2);
      const useAccent =
        hasDistinctAccent(p) && (isCenter || (r * 2 + c + accentOffset) % 5 === 0);
      const fill = useAccent ? p.accent : p.fg;
      parts.push(
        `<rect x="${num(x)}" y="${num(y)}" width="${num(cell + 0.5)}" height="${num(cell + 0.5)}" fill="${fill}"/>`
      );
    }
  }
  return parts.join('\n      ');
}

function renderSunburst(size, p, complexity, rng) {
  const cx = size / 2;
  const cy = size / 2;
  const rays = (4 + complexity * 2) * 2; // always even so alternating rays stay symmetric
  const outer = size * 0.78;
  const rot = rng() * (Math.PI / rays);
  const parts = [];

  for (let i = 0; i < rays; i++) {
    if (i % 2 === 1) continue; // leave bg wedges for stark contrast
    const a0 = rot + (2 * Math.PI * i) / rays;
    const a1 = rot + (2 * Math.PI * (i + 1)) / rays;
    const x1 = cx + outer * Math.cos(a0);
    const y1 = cy + outer * Math.sin(a0);
    const x2 = cx + outer * Math.cos(a1);
    const y2 = cy + outer * Math.sin(a1);
    const fill = hasDistinctAccent(p) && (i / 2) % 3 === 0 ? p.accent : p.fg;
    parts.push(
      `<polygon points="${num(cx)},${num(cy)} ${num(x1)},${num(y1)} ${num(x2)},${num(y2)}" fill="${fill}"/>`
    );
  }

  const hubR = size * 0.11;
  parts.push(`<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(hubR * 1.35)}" fill="${p.bg}"/>`);
  parts.push(
    `<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(hubR)}" fill="${hasDistinctAccent(p) ? p.accent : p.fg}"/>`
  );
  return parts.join('\n      ');
}

function renderSpiral(size, p, complexity, rng) {
  const cx = size / 2;
  const cy = size / 2;
  const turns = 2.2 + complexity * 0.65;
  const maxR = size * 0.47;
  const steps = 360;
  const strokeW = Math.max(18, (maxR / turns) * 0.44);
  const startAngle = rng() * Math.PI * 2;
  const dir = rng() > 0.5 ? 1 : -1;
  const pts = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = startAngle + dir * t * turns * 2 * Math.PI;
    const r = t * maxR;
    pts.push(`${num(cx + r * Math.cos(angle))},${num(cy + r * Math.sin(angle))}`);
  }

  const parts = [
    `<polyline points="${pts.join(' ')}" fill="none" stroke="${p.fg}" stroke-width="${num(strokeW)}" stroke-linecap="round" stroke-linejoin="round"/>`,
  ];

  if (hasDistinctAccent(p)) {
    // Bold focal center dot and accent outer dots along the spiral arm
    parts.push(`<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(strokeW * 1.1)}" fill="${p.accent}"/>`);
    const dotCount = 2 + complexity;
    for (let d = 1; d <= dotCount; d++) {
      const t = d / (dotCount + 0.4);
      const angle = startAngle + dir * t * turns * 2 * Math.PI + Math.PI;
      const r = t * maxR * 0.88;
      parts.push(
        `<circle cx="${num(cx + r * Math.cos(angle))}" cy="${num(cy + r * Math.sin(angle))}" r="${num(strokeW * 0.45)}" fill="${p.accent}"/>`
      );
    }
  } else {
    parts.push(`<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(strokeW * 0.8)}" fill="${p.fg}"/>`);
  }
  return parts.join('\n      ');
}

function renderPolka(size, p, complexity, rng) {
  const cols = 2 + complexity;
  const pad = size * 0.06;
  const usable = size - pad * 2;
  const cell = usable / cols;
  const baseR = cell * 0.34;
  const offset = Math.floor(rng() * cols);
  const parts = [];

  for (let row = 0; row < cols; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = pad + col * cell + cell / 2;
      const cy = pad + row * cell + cell / 2;
      const isFocal = (row + col + offset) % 3 === 0;
      const r = isFocal ? baseR * 1.12 : baseR * 0.88;
      const fill = hasDistinctAccent(p) && isFocal ? p.accent : p.fg;
      parts.push(`<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(r)}" fill="${fill}"/>`);
      if (complexity >= 4 && isFocal) {
        parts.push(`<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(r * 0.38)}" fill="${p.bg}"/>`);
      }
    }
  }
  return parts.join('\n      ');
}

function renderChevron(size, p, complexity, rng) {
  const bands = 4 + complexity * 2;
  const bandH = size / bands;
  const peaks = 2 + Math.ceil(complexity / 2);
  const segW = size / (peaks * 2);
  const amp = bandH * 0.72;
  const strokeW = bandH * 0.52;
  const accentStep = rng() > 0.5 ? 2 : 3;
  const parts = [];

  for (let i = -1; i <= bands + 1; i++) {
    const yBase = i * bandH;
    const pts = [];
    for (let k = 0; k <= peaks * 2; k++) {
      const x = k * segW;
      const y = k % 2 === 0 ? yBase + amp / 2 : yBase - amp / 2;
      pts.push(`${num(x)},${num(y)}`);
    }
    const color = hasDistinctAccent(p) && Math.abs(i) % accentStep === 1 ? p.accent : p.fg;
    parts.push(
      `<polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="${num(strokeW)}" stroke-linejoin="miter"/>`
    );
  }
  return parts.join('\n      ');
}

function renderWaves(size, p, complexity, rng) {
  const bands = 4 + complexity * 2;
  const bandH = size / bands;
  const amp = bandH * 0.42;
  const strokeW = bandH * 0.5;
  const segs = 2 + Math.ceil(complexity / 2) * 2;
  const stepX = size / segs;
  const phase = rng() > 0.5 ? 1 : -1;
  const parts = [];

  for (let i = 0; i <= bands; i++) {
    const y = i * bandH + bandH * 0.25;
    let d = `M ${num(-stepX * 0.5)} ${num(y)}`;
    let dir = phase;
    let x = -stepX * 0.5;
    for (let s = 0; s <= segs + 1; s++) {
      const cxp = x + stepX / 2;
      const cyp = y + dir * amp;
      const nx = x + stepX;
      d += ` Q ${num(cxp)},${num(cyp)} ${num(nx)},${num(y)}`;
      x = nx;
      dir = -dir;
    }
    const color = hasDistinctAccent(p) && i % 3 === 1 ? p.accent : p.fg;
    parts.push(
      `<path d="${d}" fill="none" stroke="${color}" stroke-width="${num(strokeW)}" stroke-linecap="round"/>`
    );
  }
  return parts.join('\n      ');
}

function renderDiamonds(size, p, complexity, rng) {
  const cx = size / 2;
  const cy = size / 2;
  const rings = 4 + complexity * 2;
  const maxD = size * 0.52;
  const step = maxD / rings;
  const accentEvery = rng() > 0.5 ? 4 : 6;
  const parts = [];

  for (let i = rings - 1; i >= 0; i--) {
    const half = step * (i + 1);
    let fill;
    if (i % 2 === 1) {
      fill = p.bg;
    } else if (hasDistinctAccent(p) && (i === 0 || i % accentEvery === 0)) {
      fill = p.accent;
    } else {
      fill = p.fg;
    }
    const pts = [
      `${num(cx)},${num(cy - half)}`,
      `${num(cx + half)},${num(cy)}`,
      `${num(cx)},${num(cy + half)}`,
      `${num(cx - half)},${num(cy)}`,
    ];
    parts.push(`<polygon points="${pts.join(' ')}" fill="${fill}"/>`);
  }
  return parts.join('\n      ');
}

function renderFace(size, p, complexity, rng) {
  const cx = size / 2;
  const cy = size / 2;
  const headR = size * 0.39;
  const strokeW = 14 + complexity * 2;
  const lookShift = (rng() - 0.5) * headR * 0.06;
  const parts = [];

  // Hair tuft / halo dots on top for extra visual interest at higher complexity
  if (complexity >= 3) {
    const tuftCount = 2 + Math.min(complexity, 4);
    for (let i = 0; i < tuftCount; i++) {
      const a = -Math.PI * 0.72 + (Math.PI * 0.44 * i) / (tuftCount - 1);
      const tx = cx + (headR + strokeW * 0.65) * Math.cos(a);
      const ty = cy + (headR + strokeW * 0.65) * Math.sin(a);
      parts.push(
        `<circle cx="${num(tx)}" cy="${num(ty)}" r="${num(headR * 0.08)}" fill="${hasDistinctAccent(p) && i % 2 === 0 ? p.accent : p.fg}"/>`
      );
    }
  }

  // Bold circular head outline
  parts.push(
    `<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(headR)}" fill="${p.bg}" stroke="${p.fg}" stroke-width="${num(strokeW)}"/>`
  );

  // Rosy red cheeks (or bold geometric dimples in B&W)
  const cheekR = headR * 0.16;
  const cheekOff = headR * 0.54;
  const cheekY = cy + headR * 0.16;
  if (hasDistinctAccent(p)) {
    parts.push(`<circle cx="${num(cx - cheekOff)}" cy="${num(cheekY)}" r="${num(cheekR)}" fill="${p.accent}"/>`);
    parts.push(`<circle cx="${num(cx + cheekOff)}" cy="${num(cheekY)}" r="${num(cheekR)}" fill="${p.accent}"/>`);
  }

  // Bold concentric baby-magnet eyes: black ring -> white sclera -> dark pupil -> bright catchlight
  const eyeY = cy - headR * 0.2;
  const eyeOff = headR * 0.34;
  const eyeR = headR * 0.22;
  for (const side of [-1, 1]) {
    const ex = cx + side * eyeOff;
    parts.push(`<circle cx="${num(ex)}" cy="${num(eyeY)}" r="${num(eyeR)}" fill="${p.fg}"/>`);
    parts.push(`<circle cx="${num(ex)}" cy="${num(eyeY)}" r="${num(eyeR * 0.72)}" fill="${p.bg}"/>`);
    parts.push(
      `<circle cx="${num(ex + lookShift)}" cy="${num(eyeY)}" r="${num(eyeR * 0.44)}" fill="${p.fg}"/>`
    );
    parts.push(
      `<circle cx="${num(ex + lookShift - eyeR * 0.15)}" cy="${num(eyeY - eyeR * 0.15)}" r="${num(eyeR * 0.15)}" fill="${p.bg}"/>`
    );
  }

  // Cute button nose
  const noseY = cy + headR * 0.07;
  parts.push(
    `<circle cx="${num(cx)}" cy="${num(noseY)}" r="${num(headR * 0.095)}" fill="${hasDistinctAccent(p) ? p.accent : p.fg}"/>`
  );

  // Big warm curved smile
  const smileY = cy + headR * 0.27;
  const smileW = headR * 0.42;
  const smileDepth = smileY + headR * 0.34;
  parts.push(
    `<path d="M ${num(cx - smileW)},${num(smileY)} Q ${num(cx)},${num(smileDepth)} ${num(cx + smileW)},${num(smileY)}" fill="none" stroke="${p.fg}" stroke-width="${num(14 + complexity * 2)}" stroke-linecap="round"/>`
  );
  return parts.join('\n      ');
}

function renderOwl(size, p, complexity, rng) {
  const cx = size / 2;
  const cy = size * 0.52;
  const bodyW = size * 0.34;
  const bodyH = size * 0.4;
  const accentEyes = hasDistinctAccent(p) && rng() > 0.5;
  const parts = [];

  // Ear tufts
  const tuftTopY = cy - bodyH * 1.05;
  parts.push(
    `<polygon points="${num(cx - bodyW * 0.78)},${num(cy - bodyH * 0.52)} ${num(cx - bodyW * 0.56)},${num(tuftTopY)} ${num(cx - bodyW * 0.16)},${num(cy - bodyH * 0.72)}" fill="${p.fg}"/>`
  );
  parts.push(
    `<polygon points="${num(cx + bodyW * 0.78)},${num(cy - bodyH * 0.52)} ${num(cx + bodyW * 0.56)},${num(tuftTopY)} ${num(cx + bodyW * 0.16)},${num(cy - bodyH * 0.72)}" fill="${p.fg}"/>`
  );

  // Main silhouette body
  parts.push(
    `<ellipse cx="${num(cx)}" cy="${num(cy)}" rx="${num(bodyW)}" ry="${num(bodyH)}" fill="${p.fg}"/>`
  );

  // Big staring target eyes
  const eyeY = cy - bodyH * 0.28;
  const eyeOff = bodyW * 0.44;
  const eyeR = bodyW * 0.4;
  for (const side of [-1, 1]) {
    const ex = cx + side * eyeOff;
    parts.push(`<circle cx="${num(ex)}" cy="${num(eyeY)}" r="${num(eyeR)}" fill="${p.bg}"/>`);
    parts.push(
      `<circle cx="${num(ex)}" cy="${num(eyeY)}" r="${num(eyeR * 0.72)}" fill="none" stroke="${accentEyes ? p.accent : p.fg}" stroke-width="${num(8 + complexity)}"/>`
    );
    parts.push(`<circle cx="${num(ex)}" cy="${num(eyeY)}" r="${num(eyeR * 0.42)}" fill="${p.fg}"/>`);
    parts.push(
      `<circle cx="${num(ex - eyeR * 0.14)}" cy="${num(eyeY - eyeR * 0.14)}" r="${num(eyeR * 0.14)}" fill="${p.bg}"/>`
    );
  }

  // Symmetric triangular beak
  const beakY = eyeY + eyeR * 0.58;
  const beakW = bodyW * 0.22;
  const beakH = bodyH * 0.24;
  parts.push(
    `<polygon points="${num(cx - beakW)},${num(beakY)} ${num(cx + beakW)},${num(beakY)} ${num(cx)},${num(beakY + beakH)}" fill="${hasDistinctAccent(p) ? p.accent : p.bg}"/>`
  );

  // Scalloped high-contrast belly feathers
  const bellyTop = cy + bodyH * 0.18;
  const rows = 2 + Math.min(complexity, 3);
  const rowStep = (bodyH * 0.58) / rows;
  for (let i = 0; i < rows; i++) {
    const y = bellyTop + i * rowStep;
    const w = bodyW * (0.64 - i * 0.12);
    const col = hasDistinctAccent(p) && i % 2 === 1 ? p.accent : p.bg;
    parts.push(
      `<path d="M ${num(cx - w)},${num(y)} Q ${num(cx)},${num(y + rowStep * 0.65)} ${num(cx + w)},${num(y)}" fill="none" stroke="${col}" stroke-width="${num(12 + complexity)}" stroke-linecap="round"/>`
    );
  }

  return parts.join('\n      ');
}

const RENDERERS = {
  bullseye: renderBullseye,
  checkerboard: renderCheckerboard,
  sunburst: renderSunburst,
  spiral: renderSpiral,
  polka: renderPolka,
  chevron: renderChevron,
  waves: renderWaves,
  diamonds: renderDiamonds,
  face: renderFace,
  owl: renderOwl,
};

export function getPatternById(id) {
  return PATTERNS.find((p) => p.id === id) || null;
}

export function renderPatternSvg(patternId, options = {}) {
  const meta = getPatternById(patternId);
  if (!meta || !RENDERERS[patternId]) {
    throw new Error(`Unknown patternId: ${patternId}`);
  }
  const {
    paletteId = 'bwr',
    complexity = 3,
    invert = false,
    seed = 1,
    size = 800,
    showBorder = true,
    clipId,
  } = options;

  const base = resolvePalette(paletteId);
  const p = applyInvert(base, invert);
  const c = clampComplexity(complexity);
  const s = Number.isFinite(Number(size)) && Number(size) > 0 ? Number(size) : 800;
  const rng = createRng(seed);

  const rawClipId = clipId ? String(clipId) : `card-clip-${patternId}-${s}`;
  const resolvedClipId = rawClipId.replace(/[^a-zA-Z0-9_-]/g, '-');

  const body = RENDERERS[patternId](s, p, c, rng);

  let svg = svgHeader(s, `${meta.name} high-contrast baby card`);
  svg += `\n    ${clipPath(s, resolvedClipId)}`;
  svg += `\n    <g clip-path="url(#${resolvedClipId})">`;
  svg += `\n      <rect data-role="bg" x="0" y="0" width="${s}" height="${s}" fill="${p.bg}"/>`;
  svg += `\n      ${body}`;
  svg += `\n    </g>`;
  if (showBorder) {
    svg += `\n    ${borderRect(s, p.fg)}`;
  }
  svg += `\n</svg>`;
  return svg;
}
