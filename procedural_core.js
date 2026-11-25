// Procedural high-contrast baby pattern core (pure ES module).
// Deterministic seeded helpers + geometric symmetry grammars (Truchet, Bauhaus, Mandala).

export const GENERATIVE_FAMILIES = [
  { id: 'auto', name: 'Any Style', description: 'Seed picks a balanced visual grammar automatically.' },
  { id: 'truchet', name: 'Truchet Ribbons', description: '4-way mirrored interlocking optical arcs & loops.' },
  { id: 'bauhaus', name: 'Bauhaus Quilt', description: 'Swiss geometric mosaic with crisp focal accents.' },
  { id: 'mandala', name: 'Radial Mandala', description: '4–12-fold rotational symmetry rosettes.' },
  { id: 'creature', name: 'Friendly Creatures', description: 'Procedurally invented high-contrast baby animals & faces.' },
  { id: 'opart', name: 'Op-Art Geometry', description: 'Optical targets, warped grids, and nested polygons.' },
];

export const REAL_FAMILIES = ['truchet', 'bauhaus', 'mandala', 'creature', 'opart'];

const WORDS = [
  'STAR', 'MOON', 'BEAR', 'KITE', 'WAVE', 'SUN', 'FOX', 'OWL',
  'CUBE', 'LEAF', 'DUCK', 'HALO', 'BEE', 'LUNA', 'NOVA', 'DOT',
];

export function hashSeed(input) {
  const str = String(input ?? 'STAR-101').trim() || 'STAR-101';
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function randomSeedCode() {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  const n = 100 + Math.floor(Math.random() * 900);
  return `${word}-${n}`;
}

export function resolveFamilyId(seedInt, family = 'auto') {
  if (REAL_FAMILIES.includes(family)) return family;
  const s = Number.isFinite(seedInt) ? Math.abs(Math.trunc(seedInt)) : 0;
  return REAL_FAMILIES[s % REAL_FAMILIES.length];
}

export function describeProceduralCard(seed, family = 'auto') {
  const seedText = String(seed ?? 'STAR-101').trim() || 'STAR-101';
  const seedInt = hashSeed(seedText);
  const familyId = resolveFamilyId(seedInt, family);
  const meta = GENERATIVE_FAMILIES.find((f) => f.id === familyId);
  const familyName = meta ? meta.name : familyId;
  return {
    seedText,
    seedInt,
    familyId,
    familyName,
    title: `${familyName} · ${seedText}`,
  };
}

export const f2 = (n) => Number(n).toFixed(2);
export const hasDistinctAccent = (p) => p.accent !== p.fg && p.accent !== p.bg;

// 1. Truchet Ribbons: 4-way mirrored interlocking quarter-circle arcs.
// Generating one quadrant and mirroring across X & Y guarantees bold symmetrical loops!
export function renderTruchet(size, p, complexity, rng) {
  const halfCols = 1 + Math.ceil(complexity / 2); // 2, 2, 3, 3, 4 -> grid 4x4, 6x6, 8x8
  const n = halfCols * 2;
  const cell = size / n;
  const half = cell / 2;
  const strokeW = cell * (0.28 + rng() * 0.14);
  const doubleRibbon = complexity >= 4 && rng() > 0.45;
  const hasAccent = hasDistinctAccent(p);

  // Build quadrant tile orientations (0 or 1)
  const quad = [];
  for (let r = 0; r < halfCols; r++) {
    const row = [];
    for (let c = 0; c < halfCols; c++) {
      row.push(rng() > 0.5 ? 1 : 0);
    }
    quad.push(row);
  }

  const parts = [];

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const qr = r < halfCols ? r : n - 1 - r;
      const qc = c < halfCols ? c : n - 1 - c;
      const flipH = c >= halfCols ? 1 : 0;
      const flipV = r >= halfCols ? 1 : 0;
      const orient = (quad[qr][qc] ^ flipH ^ flipV) & 1;

      const x = c * cell;
      const y = r * cell;
      const d1 =
        orient === 0
          ? `M ${f2(x + half)} ${f2(y)} A ${f2(half)} ${f2(half)} 0 0 1 ${f2(x)} ${f2(y + half)}`
          : `M ${f2(x + half)} ${f2(y)} A ${f2(half)} ${f2(half)} 0 0 0 ${f2(x + cell)} ${f2(y + half)}`;
      const d2 =
        orient === 0
          ? `M ${f2(x + cell)} ${f2(y + half)} A ${f2(half)} ${f2(half)} 0 0 1 ${f2(x + half)} ${f2(y + cell)}`
          : `M ${f2(x)} ${f2(y + half)} A ${f2(half)} ${f2(half)} 0 0 0 ${f2(x + half)} ${f2(y + cell)}`;

      const isCenterRing = qr === halfCols - 1 && qc === halfCols - 1;
      const stroke = hasAccent && isCenterRing ? p.accent : p.fg;

      parts.push(
        `<path d="${d1}" fill="none" stroke="${stroke}" stroke-width="${f2(strokeW)}" stroke-linecap="round"/>`
      );
      parts.push(
        `<path d="${d2}" fill="none" stroke="${stroke}" stroke-width="${f2(strokeW)}" stroke-linecap="round"/>`
      );
      if (doubleRibbon) {
        parts.push(
          `<path d="${d1}" fill="none" stroke="${p.bg}" stroke-width="${f2(strokeW * 0.34)}" stroke-linecap="round"/>`
        );
        parts.push(
          `<path d="${d2}" fill="none" stroke="${p.bg}" stroke-width="${f2(strokeW * 0.34)}" stroke-linecap="round"/>`
        );
      }
    }
  }

  // Focal symmetric dots at center & quadrant centers
  const cx = size / 2;
  const cy = size / 2;
  const dotCol = hasAccent ? p.accent : p.fg;
  parts.push(`<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(cell * 0.34)}" fill="${p.bg}"/>`);
  parts.push(`<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(cell * 0.22)}" fill="${dotCol}"/>`);

  if (hasAccent) {
    const qOff = size * 0.25;
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        parts.push(
          `<circle cx="${f2(cx + sx * qOff)}" cy="${f2(cy + sy * qOff)}" r="${f2(cell * 0.14)}" fill="${p.accent}"/>`
        );
      }
    }
  }

  return parts.join('\n      ');
}

// 2. Bauhaus Quilt: Swiss geometric tile mosaic with crisp primitives and balanced symmetry.
export function renderBauhaus(size, p, complexity, rng) {
  const cols = 2 + Math.min(complexity, 4); // 3..6
  const pad = size * 0.04;
  const inner = size - pad * 2;
  const cell = inner / cols;
  const hasAccent = hasDistinctAccent(p);
  const mirrorX = rng() > 0.3;
  const halfCols = Math.ceil(cols / 2);

  // Pick 1–3 deterministic accent indices without unbounded loops
  const totalSlots = cols * (mirrorX ? halfCols : cols);
  const accentSet = new Set();
  if (hasAccent) {
    const pickA = Math.floor(rng() * totalSlots);
    const pickB = (pickA + Math.max(1, Math.floor(totalSlots / 2))) % totalSlots;
    accentSet.add(pickA);
    if (cols >= 4) accentSet.add(pickB);
  }

  // Pre-generate tile specs
  const specs = [];
  for (let r = 0; r < cols; r++) {
    const row = [];
    for (let c = 0; c < halfCols; c++) {
      row.push({
        kind: Math.floor(rng() * 7),
        rot: Math.floor(rng() * 4) * 90,
        invertCell: rng() > 0.72,
      });
    }
    specs.push(row);
  }

  const parts = [];
  for (let r = 0; r < cols; r++) {
    for (let c = 0; c < cols; c++) {
      const srcC = mirrorX && c >= halfCols ? cols - 1 - c : c % halfCols;
      const spec = mirrorX
        ? specs[r][srcC]
        : {
            kind: Math.floor(rng() * 7),
            rot: Math.floor(rng() * 4) * 90,
            invertCell: rng() > 0.72,
          };
      const slotIdx = r * (mirrorX ? halfCols : cols) + (mirrorX ? srcC : c);
      const isAccent = accentSet.has(slotIdx);

      const x = pad + c * cell;
      const y = pad + r * cell;
      const cx = x + cell / 2;
      const cy = y + cell / 2;
      const flipScale = mirrorX && c >= halfCols ? -1 : 1;

      const cellBg = spec.invertCell ? p.fg : p.bg;
      const shapeCol = isAccent ? p.accent : spec.invertCell ? p.bg : p.fg;
      const secCol = spec.invertCell ? p.fg : p.bg;

      const gTransform = `translate(${f2(cx)} ${f2(cy)}) scale(${flipScale}, 1) rotate(${spec.rot}) translate(${f2(-cell / 2)} ${f2(-cell / 2)})`;
      let innerSvg = `<rect x="0" y="0" width="${f2(cell + 0.5)}" height="${f2(cell + 0.5)}" fill="${cellBg}"/>`;

      if (spec.kind === 0) {
        // Bold quarter circle
        innerSvg += `<path d="M 0 0 L ${f2(cell)} 0 A ${f2(cell)} ${f2(cell)} 0 0 1 0 ${f2(cell)} Z" fill="${shapeCol}"/>`;
      } else if (spec.kind === 1) {
        // Semicircle
        innerSvg += `<path d="M 0 ${f2(cell)} A ${f2(cell / 2)} ${f2(cell / 2)} 0 0 1 ${f2(cell)} ${f2(cell)} Z" fill="${shapeCol}"/>`;
      } else if (spec.kind === 2) {
        // Diagonal split triangle
        innerSvg += `<polygon points="0,0 ${f2(cell)},0 0,${f2(cell)}" fill="${shapeCol}"/>`;
      } else if (spec.kind === 3) {
        // Concentric target dot
        innerSvg += `<circle cx="${f2(cell / 2)}" cy="${f2(cell / 2)}" r="${f2(cell * 0.42)}" fill="${shapeCol}"/>`;
        innerSvg += `<circle cx="${f2(cell / 2)}" cy="${f2(cell / 2)}" r="${f2(cell * 0.18)}" fill="${secCol}"/>`;
      } else if (spec.kind === 4) {
        // Bold vertical stripes
        const stripe = cell / 5;
        for (let s = 0; s < 5; s += 2) {
          innerSvg += `<rect x="${f2(s * stripe)}" y="0" width="${f2(stripe)}" height="${f2(cell)}" fill="${shapeCol}"/>`;
        }
      } else if (spec.kind === 5) {
        // Bold diamond
        innerSvg += `<polygon points="${f2(cell / 2)},${f2(cell * 0.06)} ${f2(cell * 0.94)},${f2(cell / 2)} ${f2(cell / 2)},${f2(cell * 0.94)} ${f2(cell * 0.06)},${f2(cell / 2)}" fill="${shapeCol}"/>`;
      } else {
        // Opposite quarter arcs
        innerSvg += `<path d="M 0 0 L ${f2(cell * 0.5)} 0 A ${f2(cell * 0.5)} ${f2(cell * 0.5)} 0 0 1 0 ${f2(cell * 0.5)} Z" fill="${shapeCol}"/>`;
        innerSvg += `<path d="M ${f2(cell)} ${f2(cell)} L ${f2(cell * 0.5)} ${f2(cell)} A ${f2(cell * 0.5)} ${f2(cell * 0.5)} 0 0 1 ${f2(cell)} ${f2(cell * 0.5)} Z" fill="${shapeCol}"/>`;
      }

      parts.push(`<g transform="${gTransform}">${innerSvg}</g>`);
    }
  }
  return parts.join('\n      ');
}

// 3. Radial Mandala: Rotational symmetry rosette with crisp alternating rings & petals.
export function renderMandala(size, p, complexity, rng) {
  const folds = [4, 6, 8, 12][Math.floor(rng() * 4)];
  const layers = 3 + complexity;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.45;
  const hasAccent = hasDistinctAccent(p);
  const styleOffset = Math.floor(rng() * 3);
  const parts = [];

  for (let layer = layers; layer >= 1; layer--) {
    const outerR = (maxR * layer) / layers;
    const innerR = (maxR * (layer - 1)) / layers;
    const midR = (outerR + innerR) / 2;
    const bandW = outerR - innerR;
    const kind = (layer + styleOffset) % 3;
    const useAccent = hasAccent && layer % 3 === 0;
    const col = useAccent ? p.accent : p.fg;

    // Backing contrast ring on alternating layers
    if (layer % 2 === 0) {
      parts.push(`<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(outerR)}" fill="${p.fg}"/>`);
      parts.push(`<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(outerR - bandW * 0.14)}" fill="${p.bg}"/>`);
    }

    for (let i = 0; i < folds; i++) {
      const a = (Math.PI * 2 * i) / folds + (layer % 2 === 0 ? Math.PI / folds : 0);
      const deg = (a * 180) / Math.PI + 90;
      const x = cx + midR * Math.cos(a);
      const y = cy + midR * Math.sin(a);

      if (kind === 0) {
        // Pointed diamond petal
        const pw = Math.min(bandW * 0.42, (Math.PI * midR) / folds * 0.72);
        const ph = bandW * 0.48;
        parts.push(
          `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(deg)})"><polygon points="0,${f2(-ph)} ${f2(pw)},0 0,${f2(ph)} ${f2(-pw)},0" fill="${col}"/></g>`
        );
      } else if (kind === 1) {
        // Bold circular pearl with inner dot
        const pr = Math.min(bandW * 0.38, (Math.PI * midR) / folds * 0.68);
        parts.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(pr)}" fill="${col}"/>`);
        if (pr > 14) {
          parts.push(`<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(pr * 0.36)}" fill="${p.bg}"/>`);
        }
      } else {
        // Bold outward triangle spike
        const bw = Math.min(bandW * 0.44, (Math.PI * midR) / folds * 0.75);
        const th = bandW * 0.48;
        parts.push(
          `<g transform="translate(${f2(x)} ${f2(y)}) rotate(${f2(deg)})"><polygon points="0,${f2(-th)} ${f2(bw)},${f2(th)} ${f2(-bw)},${f2(th)}" fill="${col}"/></g>`
        );
      }
    }
  }

  // Crisp center target bullseye
  const coreR = maxR * 0.24;
  const accentOrFg = hasAccent ? p.accent : p.fg;
  parts.push(`<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(coreR)}" fill="${p.fg}"/>`);
  parts.push(`<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(coreR * 0.66)}" fill="${p.bg}"/>`);
  parts.push(`<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(coreR * 0.34)}" fill="${accentOrFg}"/>`);

  return parts.join('\n      ');
}
