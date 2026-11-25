// Procedural high-contrast baby creatures & optical-art grammars (pure ES module).
import { f2, hasDistinctAccent } from './procedural_core.js';

// 4. Friendly Creatures: Procedurally invents adorable high-contrast baby faces & animals.
export function renderCreature(size, p, complexity, rng) {
  const cx = size / 2;
  const cy = size * 0.54;
  const headR = size * 0.33;
  const strokeW = 14 + complexity * 2;
  const hasAccent = hasDistinctAccent(p);
  const accentOrFg = hasAccent ? p.accent : p.fg;

  const earStyles = ['bear', 'cat', 'bunny', 'owl', 'halo'];
  const headShapes = ['circle', 'oval', 'rounded'];
  const eyeStyles = ['target', 'big', 'star'];
  const noseStyles = ['button', 'triangle', 'oval'];
  const mouthStyles = ['smile', 'cat', 'happy'];

  const earStyle = earStyles[Math.floor(rng() * earStyles.length)];
  const headShape = headShapes[Math.floor(rng() * headShapes.length)];
  const eyeStyle = eyeStyles[Math.floor(rng() * eyeStyles.length)];
  const noseStyle = noseStyles[Math.floor(rng() * noseStyles.length)];
  const mouthStyle = mouthStyles[Math.floor(rng() * mouthStyles.length)];
  const hasWhiskers = complexity >= 3 && rng() > 0.45;
  const hasCrownMark = complexity >= 4;

  const parts = [];

  // Ears / Top Silhouette (drawn behind head)
  if (earStyle === 'bear') {
    const earR = headR * 0.36;
    for (const side of [-1, 1]) {
      const ex = cx + side * headR * 0.72;
      const ey = cy - headR * 0.74;
      parts.push(`<circle cx="${f2(ex)}" cy="${f2(ey)}" r="${f2(earR)}" fill="${p.fg}"/>`);
      parts.push(
        `<circle cx="${f2(ex)}" cy="${f2(ey)}" r="${f2(earR * 0.52)}" fill="${hasAccent ? p.accent : p.bg}"/>`
      );
    }
  } else if (earStyle === 'cat') {
    for (const side of [-1, 1]) {
      const x1 = cx + side * headR * 0.28;
      const y1 = cy - headR * 0.82;
      const x2 = cx + side * headR * 0.88;
      const y2 = cy - headR * 0.38;
      const tipX = cx + side * headR * 0.86;
      const tipY = cy - headR * 1.24;
      parts.push(`<polygon points="${f2(x1)},${f2(y1)} ${f2(tipX)},${f2(tipY)} ${f2(x2)},${f2(y2)}" fill="${p.fg}"/>`);
      const ix1 = cx + side * headR * 0.44;
      const iy1 = cy - headR * 0.8;
      const ix2 = cx + side * headR * 0.78;
      const iy2 = cy - headR * 0.52;
      const itipX = cx + side * headR * 0.77;
      const itipY = cy - headR * 1.04;
      parts.push(
        `<polygon points="${f2(ix1)},${f2(iy1)} ${f2(itipX)},${f2(itipY)} ${f2(ix2)},${f2(iy2)}" fill="${hasAccent ? p.accent : p.bg}"/>`
      );
    }
  } else if (earStyle === 'bunny') {
    for (const side of [-1, 1]) {
      const ex = cx + side * headR * 0.42;
      const ey = cy - headR * 1.05;
      const rot = side * 12;
      parts.push(
        `<ellipse cx="${f2(ex)}" cy="${f2(ey)}" rx="${f2(headR * 0.22)}" ry="${f2(headR * 0.52)}" transform="rotate(${rot} ${f2(ex)} ${f2(ey)})" fill="${p.fg}"/>`
      );
      parts.push(
        `<ellipse cx="${f2(ex)}" cy="${f2(ey)}" rx="${f2(headR * 0.1)}" ry="${f2(headR * 0.34)}" transform="rotate(${rot} ${f2(ex)} ${f2(ey)})" fill="${hasAccent ? p.accent : p.bg}"/>`
      );
    }
  } else if (earStyle === 'owl') {
    for (const side of [-1, 1]) {
      const x1 = cx + side * headR * 0.32;
      const y1 = cy - headR * 0.85;
      const x2 = cx + side * headR * 0.94;
      const y2 = cy - headR * 0.65;
      const tipX = cx + side * headR * 1.04;
      const tipY = cy - headR * 1.12;
      parts.push(`<polygon points="${f2(x1)},${f2(y1)} ${f2(tipX)},${f2(tipY)} ${f2(x2)},${f2(y2)}" fill="${p.fg}"/>`);
    }
  } else {
    // Halo crown of bold alternating dots
    const dots = 7;
    for (let i = 0; i < dots; i++) {
      const a = -Math.PI * 0.82 + (Math.PI * 0.64 * i) / (dots - 1);
      const dx = cx + headR * 1.18 * Math.cos(a);
      const dy = cy + headR * 1.18 * Math.sin(a);
      const col = hasAccent && i % 2 === 1 ? p.accent : p.fg;
      parts.push(`<circle cx="${f2(dx)}" cy="${f2(dy)}" r="${f2(headR * 0.13)}" fill="${col}"/>`);
    }
  }

  // Head silhouette
  if (headShape === 'circle') {
    parts.push(
      `<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(headR)}" fill="${p.bg}" stroke="${p.fg}" stroke-width="${f2(strokeW)}"/>`
    );
  } else if (headShape === 'oval') {
    parts.push(
      `<ellipse cx="${f2(cx)}" cy="${f2(cy)}" rx="${f2(headR * 1.08)}" ry="${f2(headR * 0.94)}" fill="${p.bg}" stroke="${p.fg}" stroke-width="${f2(strokeW)}"/>`
    );
  } else {
    const rw = headR * 2.02;
    const rh = headR * 1.88;
    parts.push(
      `<rect x="${f2(cx - rw / 2)}" y="${f2(cy - rh / 2)}" width="${f2(rw)}" height="${f2(rh)}" rx="${f2(headR * 0.56)}" fill="${p.bg}" stroke="${p.fg}" stroke-width="${f2(strokeW)}"/>`
    );
  }

  // Forehead markings at higher complexity
  if (hasCrownMark) {
    for (const side of [-1, 0, 1]) {
      const mx = cx + side * headR * 0.18;
      const my = cy - headR * 0.66;
      const h = side === 0 ? headR * 0.22 : headR * 0.15;
      parts.push(
        `<line x1="${f2(mx)}" y1="${f2(my - h / 2)}" x2="${f2(mx)}" y2="${f2(my + h / 2)}" stroke="${side === 0 && hasAccent ? p.accent : p.fg}" stroke-width="${f2(10 + complexity)}" stroke-linecap="round"/>`
      );
    }
  }

  // Rosy cheeks
  if (hasAccent) {
    const chY = cy + headR * 0.18;
    const chOff = headR * 0.58;
    parts.push(`<circle cx="${f2(cx - chOff)}" cy="${f2(chY)}" r="${f2(headR * 0.16)}" fill="${p.accent}"/>`);
    parts.push(`<circle cx="${f2(cx + chOff)}" cy="${f2(chY)}" r="${f2(headR * 0.16)}" fill="${p.accent}"/>`);
  }

  // Cute bold whiskers
  if (hasWhiskers) {
    const wy = cy + headR * 0.14;
    for (const side of [-1, 1]) {
      for (const dy of [-18, 0, 18]) {
        const x1 = cx + side * headR * 0.48;
        const x2 = cx + side * headR * 0.92;
        parts.push(
          `<line x1="${f2(x1)}" y1="${f2(wy + dy * 0.5)}" x2="${f2(x2)}" y2="${f2(wy + dy * 1.2)}" stroke="${p.fg}" stroke-width="8" stroke-linecap="round"/>`
        );
      }
    }
  }

  // Eyes (huge, bold, high-contrast baby focal points)
  const eyeY = cy - headR * 0.18;
  const eyeOff = headR * 0.38;
  const eyeR = headR * 0.24;
  for (const side of [-1, 1]) {
    const ex = cx + side * eyeOff;
    if (eyeStyle === 'target') {
      parts.push(`<circle cx="${f2(ex)}" cy="${f2(eyeY)}" r="${f2(eyeR)}" fill="${p.fg}"/>`);
      parts.push(`<circle cx="${f2(ex)}" cy="${f2(eyeY)}" r="${f2(eyeR * 0.68)}" fill="${p.bg}"/>`);
      parts.push(`<circle cx="${f2(ex)}" cy="${f2(eyeY)}" r="${f2(eyeR * 0.42)}" fill="${p.fg}"/>`);
      parts.push(`<circle cx="${f2(ex - eyeR * 0.16)}" cy="${f2(eyeY - eyeR * 0.16)}" r="${f2(eyeR * 0.14)}" fill="${p.bg}"/>`);
    } else if (eyeStyle === 'big') {
      parts.push(`<circle cx="${f2(ex)}" cy="${f2(eyeY)}" r="${f2(eyeR * 0.92)}" fill="${p.fg}"/>`);
      parts.push(`<circle cx="${f2(ex - eyeR * 0.24)}" cy="${f2(eyeY - eyeR * 0.24)}" r="${f2(eyeR * 0.26)}" fill="${p.bg}"/>`);
      parts.push(`<circle cx="${f2(ex + eyeR * 0.22)}" cy="${f2(eyeY + eyeR * 0.2)}" r="${f2(eyeR * 0.12)}" fill="${p.bg}"/>`);
    } else {
      // Starburst-ring eyes
      parts.push(`<circle cx="${f2(ex)}" cy="${f2(eyeY)}" r="${f2(eyeR)}" fill="${p.fg}"/>`);
      parts.push(`<circle cx="${f2(ex)}" cy="${f2(eyeY)}" r="${f2(eyeR * 0.65)}" fill="${p.bg}"/>`);
      const sR = eyeR * 0.48;
      const pts = [];
      for (let k = 0; k < 8; k++) {
        const a = (Math.PI * 2 * k) / 8;
        const r = k % 2 === 0 ? sR : sR * 0.42;
        pts.push(`${f2(ex + r * Math.cos(a))},${f2(eyeY + r * Math.sin(a))}`);
      }
      parts.push(`<polygon points="${pts.join(' ')}" fill="${p.fg}"/>`);
    }
  }

  // Nose
  const noseY = cy + headR * 0.08;
  if (noseStyle === 'button') {
    parts.push(`<circle cx="${f2(cx)}" cy="${f2(noseY)}" r="${f2(headR * 0.11)}" fill="${accentOrFg}"/>`);
  } else if (noseStyle === 'triangle') {
    const nw = headR * 0.14;
    const nh = headR * 0.16;
    parts.push(
      `<polygon points="${f2(cx - nw)},${f2(noseY - nh * 0.35)} ${f2(cx + nw)},${f2(noseY - nh * 0.35)} ${f2(cx)},${f2(noseY + nh * 0.75)}" fill="${accentOrFg}"/>`
    );
  } else {
    parts.push(
      `<ellipse cx="${f2(cx)}" cy="${f2(noseY)}" rx="${f2(headR * 0.14)}" ry="${f2(headR * 0.095)}" fill="${accentOrFg}"/>`
    );
  }

  // Mouth
  const mouthY = cy + headR * 0.28;
  const mouthStroke = 12 + complexity * 2;
  if (mouthStyle === 'smile') {
    const w = headR * 0.38;
    parts.push(
      `<path d="M ${f2(cx - w)} ${f2(mouthY)} Q ${f2(cx)} ${f2(mouthY + headR * 0.32)} ${f2(cx + w)} ${f2(mouthY)}" fill="none" stroke="${p.fg}" stroke-width="${f2(mouthStroke)}" stroke-linecap="round"/>`
    );
  } else if (mouthStyle === 'cat') {
    const w = headR * 0.34;
    parts.push(
      `<path d="M ${f2(cx - w)} ${f2(mouthY + 6)} Q ${f2(cx - w / 2)} ${f2(mouthY + headR * 0.24)} ${f2(cx)} ${f2(mouthY + 4)} Q ${f2(cx + w / 2)} ${f2(mouthY + headR * 0.24)} ${f2(cx + w)} ${f2(mouthY + 6)}" fill="none" stroke="${p.fg}" stroke-width="${f2(mouthStroke)}" stroke-linecap="round" stroke-linejoin="round"/>`
    );
  } else {
    // Open happy D-smile
    const w = headR * 0.34;
    const h = headR * 0.28;
    parts.push(
      `<path d="M ${f2(cx - w)} ${f2(mouthY)} L ${f2(cx + w)} ${f2(mouthY)} A ${f2(w)} ${f2(h)} 0 0 1 ${f2(cx - w)} ${f2(mouthY)} Z" fill="${p.fg}"/>`
    );
    parts.push(
      `<ellipse cx="${f2(cx)}" cy="${f2(mouthY + h * 0.65)}" rx="${f2(w * 0.45)}" ry="${f2(h * 0.26)}" fill="${hasAccent ? p.accent : p.bg}"/>`
    );
  }

  return parts.join('\n      ');
}

// 5. Op-Art Geometry: Bold optical targets, nested rotating polygons, and lens illusions.
export function renderOpArt(size, p, complexity, rng) {
  const cx = size / 2;
  const cy = size / 2;
  const hasAccent = hasDistinctAccent(p);
  const accentOrFg = hasAccent ? p.accent : p.fg;
  const mode = Math.floor(rng() * 3);
  const parts = [];

  if (mode === 0) {
    // Nested rotating polygons (squares, hexagons, or octagons)
    const sides = [4, 6, 8][Math.floor(rng() * 3)];
    const rings = 5 + complexity * 2;
    const twistDeg = (rng() > 0.5 ? 1 : -1) * (5 + Math.floor(rng() * 10));
    const maxR = size * 0.64;

    for (let i = rings; i >= 1; i--) {
      const r = (maxR * i) / rings;
      const rot = ((rings - i) * twistDeg * Math.PI) / 180;
      const pts = [];
      for (let k = 0; k < sides; k++) {
        const a = rot + (Math.PI * 2 * k) / sides - Math.PI / 2;
        pts.push(`${f2(cx + r * Math.cos(a))},${f2(cy + r * Math.sin(a))}`);
      }
      let fill;
      if (i % 2 === 0) {
        fill = p.bg;
      } else if (hasAccent && (i === 1 || i === 5)) {
        fill = p.accent;
      } else {
        fill = p.fg;
      }
      parts.push(`<polygon points="${pts.join(' ')}" fill="${fill}"/>`);
    }
  } else if (mode === 1) {
    // Bold checkerboard with circular inverted bullseye lens in the center
    const cols = 4 + complexity;
    const cell = size / cols;
    for (let r = 0; r < cols; r++) {
      for (let c = 0; c < cols; c++) {
        if ((r + c) % 2 === 0) {
          parts.push(
            `<rect x="${f2(c * cell)}" y="${f2(r * cell)}" width="${f2(cell + 0.5)}" height="${f2(cell + 0.5)}" fill="${p.fg}"/>`
          );
        }
      }
    }
    // High-contrast circular optical lens
    const lensR = size * 0.34;
    const lensRings = 3 + Math.ceil(complexity / 2);
    for (let i = lensRings; i >= 1; i--) {
      const r = (lensR * i) / lensRings;
      let fill;
      if (i % 2 === 0) {
        fill = p.bg;
      } else if (hasAccent && i === 1) {
        fill = p.accent;
      } else {
        fill = p.fg;
      }
      parts.push(`<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(r)}" fill="${fill}"/>`);
    }
    if (hasAccent) {
      parts.push(
        `<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(lensR)}" fill="none" stroke="${p.accent}" stroke-width="${f2(size * 0.025)}"/>`
      );
    }
  } else {
    // Starburst wedges intersected by concentric counter-phase rings
    const rays = (5 + complexity * 2) * 2;
    const outer = size * 0.78;
    for (let i = 0; i < rays; i += 2) {
      const a0 = (Math.PI * 2 * i) / rays;
      const a1 = (Math.PI * 2 * (i + 1)) / rays;
      const x1 = cx + outer * Math.cos(a0);
      const y1 = cy + outer * Math.sin(a0);
      const x2 = cx + outer * Math.cos(a1);
      const y2 = cy + outer * Math.sin(a1);
      parts.push(`<polygon points="${f2(cx)},${f2(cy)} ${f2(x1)},${f2(y1)} ${f2(x2)},${f2(y2)}" fill="${p.fg}"/>`);
    }
    const ringCount = 2 + complexity;
    for (let i = 1; i <= ringCount; i++) {
      const r = (size * 0.44 * i) / ringCount;
      const col = hasAccent && i === Math.ceil(ringCount / 2) ? p.accent : p.bg;
      parts.push(
        `<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(r)}" fill="none" stroke="${col}" stroke-width="${f2(size * 0.032)}"/>`
      );
    }
    parts.push(`<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(size * 0.1)}" fill="${p.bg}"/>`);
    parts.push(`<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(size * 0.068)}" fill="${accentOrFg}"/>`);
  }

  return parts.join('\n      ');
}
