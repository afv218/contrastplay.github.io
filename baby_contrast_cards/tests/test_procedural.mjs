import test from 'node:test';
import assert from 'node:assert/strict';

import {
  GENERATIVE_FAMILIES,
  REAL_FAMILIES,
  hashSeed,
  randomSeedCode,
  describeProceduralCard,
  renderProceduralSvg,
} from '../procedural.js';

const SEEDS = ['STAR-101', 'MOON-404', 'BEAR-777'];
const BAD = /NaN|Infinity|-Infinity|undefined/;

test('GENERATIVE_FAMILIES has 6 entries: auto plus all 5 REAL_FAMILIES', () => {
  const ids = GENERATIVE_FAMILIES.map((f) => f.id);
  assert.equal(ids.length, 6, 'six families total');
  assert.ok(ids.includes('auto'), 'includes auto');
  assert.equal(REAL_FAMILIES.length, 5, 'five real families');
  for (const id of REAL_FAMILIES) {
    assert.ok(ids.includes(id), `family list contains ${id}`);
  }
  const unique = new Set(ids);
  assert.equal(unique.size, 6, 'all entries unique');
});

test('hashSeed is deterministic and returns unsigned 32-bit ints; randomSeedCode matches pattern', () => {
  assert.equal(hashSeed('STAR-101'), hashSeed('STAR-101'), 'string deterministic');
  assert.equal(hashSeed(12345), hashSeed(12345), 'number deterministic');
  assert.notEqual(hashSeed('STAR-101'), hashSeed('MOON-404'), 'different strings differ');
  const max = 0xffffffff;
  for (const v of ['STAR-101', 'MOON-404', 7, 42, 2147483648, 'BEAR-777']) {
    const h = hashSeed(v);
    assert.ok(Number.isInteger(h), `${v} -> integer`);
    assert.ok(h >= 0 && h <= max, `${v} -> unsigned 32-bit`);
  }
  for (let i = 0; i < 25; i++) {
    const code = randomSeedCode();
    assert.match(code, /^[A-Z]+-\d{3}$/, `randomSeedCode matches pattern: ${code}`);
  }
});

test('describeProceduralCard resolves auto deterministically into a valid real family', () => {
  const a = describeProceduralCard('STAR-101', 'auto');
  const b = describeProceduralCard('STAR-101', 'auto');
  assert.deepEqual(a, b, 'auto resolution is deterministic');
  assert.ok(REAL_FAMILIES.includes(a.familyId), `auto resolved to real family: ${a.familyId}`);
  assert.ok(Number.isInteger(a.seedInt), 'seedInt is an integer');
  assert.ok(typeof a.title === 'string' && a.title.length > 0, 'has a title');
});

test('Every family renders valid SVG with no NaN/Infinity/undefined across complexities and seeds', () => {
  for (const { id: family } of GENERATIVE_FAMILIES) {
    for (const seed of SEEDS) {
      for (let complexity = 1; complexity <= 5; complexity++) {
        const svg = renderProceduralSvg({ seed, family, complexity });
        assert.ok(svg.startsWith('<svg'), `${family}/${seed} starts with <svg>`);
        assert.ok(svg.trimEnd().endsWith('</svg>'), `${family}/${seed} ends with </svg>`);
        assert.ok(svg.includes('xmlns="http://www.w3.org/2000/svg"'), `${family}/${seed} has xmlns`);
        assert.ok(!BAD.test(svg), `${family}/${seed} c${complexity} has no NaN/Infinity`);
        assert.ok(!svg.includes('undefined'), `${family}/${seed} c${complexity} has no undefined`);
      }
    }
  }
});

test('Determinism and seed diversity within a family', () => {
  const opts = { family: 'mandala', complexity: 4 };
  const sameA = renderProceduralSvg({ ...opts, seed: 'STAR-101' });
  const sameB = renderProceduralSvg({ ...opts, seed: 'STAR-101' });
  assert.equal(sameA, sameB, 'same seed + options identical');

  const varied = new Set(SEEDS.map((seed) => renderProceduralSvg({ ...opts, seed })));
  assert.equal(varied.size, SEEDS.length, 'different seeds produce different SVGs');
});

test('Palette guarantees: bwr always has red; bw (normal and invert) never does', () => {
  for (const family of REAL_FAMILIES) {
    for (const seed of SEEDS) {
      const bwr = renderProceduralSvg({ seed, family, paletteId: 'bwr' });
      assert.ok(bwr.includes('#D91E18'), `${family}/${seed} bwr contains red`);

      const bw = renderProceduralSvg({ seed, family, paletteId: 'bw' });
      assert.ok(!bw.includes('#D91E18'), `${family}/${seed} bw has no red`);

      const bwInverted = renderProceduralSvg({ seed, family, paletteId: 'bw', invert: true });
      assert.ok(!bwInverted.includes('#D91E18'), `${family}/${seed} bw invert has no red`);
    }
  }
});

test('Unique clipId: size and explicit clipId produce matching clipPath and clip-path', () => {
  const small = renderProceduralSvg({ seed: 'STAR-101', size: 160 });
  const smallClip = small.match(/<clipPath id="([^"]+)">/)[1];
  assert.ok(small.includes(`clip-path="url(#${smallClip})"`), 'small clipPath matches clip-path');

  const big = renderProceduralSvg({ seed: 'STAR-101', size: 800 });
  const bigClip = big.match(/<clipPath id="([^"]+)">/)[1];
  assert.ok(big.includes(`clip-path="url(#${bigClip})"`), 'big clipPath matches clip-path');
  assert.notEqual(smallClip, bigClip, 'different sizes -> different clip ids');

  const stage = renderProceduralSvg({ seed: 'STAR-101', clipId: 'stage-main' });
  assert.ok(stage.includes('id="stage-main"'), 'explicit clip id present');
  assert.ok(stage.includes('clip-path="url(#stage-main)"'), 'explicit clip id used');
});
