import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PALETTES,
  PATTERNS,
  createRng,
  renderPatternSvg,
  getPatternById,
} from '../patterns.js';

const ALL_IDS = PATTERNS.map((p) => p.id);

test('PATTERNS has all 10 unique IDs and metadata', () => {
  assert.equal(PATTERNS.length, 10);
  const unique = new Set(ALL_IDS);
  assert.equal(unique.size, 10, 'all IDs unique');
  for (const p of PATTERNS) {
    assert.ok(typeof p.id === 'string' && p.id.length > 0);
    assert.ok(typeof p.name === 'string' && p.name.length > 0);
    assert.ok(typeof p.category === 'string' && p.category.length > 0);
    assert.ok(typeof p.description === 'string' && p.description.length > 0);
  }
  for (const id of [
    'bullseye',
    'checkerboard',
    'sunburst',
    'spiral',
    'polka',
    'chevron',
    'waves',
    'diamonds',
    'face',
    'owl',
  ]) {
    assert.ok(unique.has(id), `contains ${id}`);
  }
});

test('PALETTES exposes the four required palettes', () => {
  for (const id of ['bw', 'bwr', 'rw', 'bwr_dark']) {
    assert.ok(PALETTES[id], `palette ${id} exists`);
    assert.ok(PALETTES[id].bg && PALETTES[id].fg && PALETTES[id].accent);
  }
});

test('createRng is deterministic and within [0, 1)', () => {
  const a = createRng(1);
  const b = createRng(1);
  for (let i = 0; i < 100; i++) {
    const v = a();
    assert.ok(v >= 0 && v < 1, `value ${v} in [0,1)`);
    assert.equal(v, b());
  }
});

test('Every pattern renders valid SVG', () => {
  for (const id of ALL_IDS) {
    const svg = renderPatternSvg(id, { size: 800 });
    assert.ok(svg.startsWith('<svg'), `${id} starts with <svg>`);
    assert.ok(svg.trimEnd().endsWith('</svg>'), `${id} ends with </svg>`);
    assert.ok(svg.includes('xmlns="http://www.w3.org/2000/svg"'), `${id} has xmlns`);
    assert.ok(svg.includes('viewBox="0 0 800 800"'), `${id} has viewBox 0 0 800 800`);
    assert.ok(svg.includes('<clipPath'), `${id} has clipPath`);
    assert.ok(svg.includes('data-role="bg"'), `${id} has background rect`);
  }
});

test('Determinism: same pattern+options produces identical strings', () => {
  for (const id of ALL_IDS) {
    for (const opts of [
      {},
      { complexity: 5, invert: true, seed: 7 },
      { paletteId: 'rw', size: 600, showBorder: false },
    ]) {
      const a = renderPatternSvg(id, opts);
      const b = renderPatternSvg(id, opts);
      assert.equal(a, b, `${id} deterministic`);
    }
  }
});

test('Complexity clamping (0,1,3,5,99) works cleanly for all patterns', () => {
  const bad = /NaN|Infinity|-Infinity/;
  for (const id of ALL_IDS) {
    for (const c of [0, 1, 3, 5, 99]) {
      const svg = renderPatternSvg(id, { complexity: c });
      assert.ok(!bad.test(svg), `${id} complexity ${c} has no NaN/Infinity`);
      assert.ok(!svg.includes('undefined'), `${id} complexity ${c} has no undefined`);
    }
  }
});

test('Palette & invert mode behavior across all patterns', () => {
  for (const id of ALL_IDS) {
    const bwr = renderPatternSvg(id, { paletteId: 'bwr' });
    assert.ok(bwr.includes('#D91E18'), `${id} in bwr contains accent red`);

    const bw = renderPatternSvg(id, { paletteId: 'bw' });
    assert.ok(!bw.includes('#D91E18'), `${id} in bw has no red`);
    assert.ok(bw.includes('#000000') && bw.includes('#FFFFFF'), `${id} in bw has both black and white`);
  }

  const normal = renderPatternSvg('bullseye', { paletteId: 'bwr' });
  const inverted = renderPatternSvg('bullseye', { paletteId: 'bwr', invert: true });
  assert.ok(normal.includes('data-role="bg" x="0" y="0" width="800" height="800" fill="#FFFFFF"'));
  assert.ok(inverted.includes('data-role="bg" x="0" y="0" width="800" height="800" fill="#000000"'));
});

test('Unknown patternId throws an Error', () => {
  assert.throws(() => renderPatternSvg('nope'), Error);
  assert.throws(() => renderPatternSvg(''), Error);
});

test('No invalid numbers (NaN, Infinity, undefined) across all patterns and complexities', () => {
  const bad = /NaN|Infinity|undefined/;
  for (const id of ALL_IDS) {
    for (const c of [1, 2, 3, 4, 5]) {
      const svg = renderPatternSvg(id, { complexity: c });
      assert.ok(!bad.test(svg), `${id} complexity ${c} clean`);
    }
  }
});

test('getPatternById helper returns object or null', () => {
  assert.equal(getPatternById('owl').id, 'owl');
  assert.equal(getPatternById('missing'), null);
});

test('Unique clipPath IDs prevent multi-size SVG collisions', () => {
  const small = renderPatternSvg('bullseye', { size: 160 });
  assert.ok(small.includes('id="card-clip-bullseye-160"'), `small has default clip id`);
  assert.ok(small.includes('clip-path="url(#card-clip-bullseye-160)"'), `small uses default clip id`);

  const big = renderPatternSvg('bullseye', { size: 800 });
  assert.ok(big.includes('id="card-clip-bullseye-800"'), `big has default clip id`);
  assert.ok(big.includes('clip-path="url(#card-clip-bullseye-800)"'), `big uses default clip id`);

  const stage = renderPatternSvg('bullseye', { size: 800, clipId: 'stage-main' });
  assert.ok(stage.includes('id="stage-main"'), `stage has custom clip id`);
  assert.ok(stage.includes('clip-path="url(#stage-main)"'), `stage uses custom clip id`);

  assert.notEqual(small, big, 'different sizes produce different clip ids');
});
