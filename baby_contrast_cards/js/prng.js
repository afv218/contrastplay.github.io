// Deterministic PRNG + palettes for the high-contrast baby card generator.
// Pure ES module: zero DOM dependencies, works in browser and Node.js.

export const PALETTES = {
  bw: { id: "bw", label: "Black & White", bg: "#FFFFFF", fg: "#0A0A0A", accent: "#0A0A0A" },
  bwr: { id: "bwr", label: "Black, White & Red", bg: "#FFFFFF", fg: "#0A0A0A", accent: "#D90429" },
};

// FNV-1a 32-bit hash — stable across platforms for strings and numbers.
export function hashSeed(input) {
  const str = String(input);
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

// Mulberry32 — small, fast, deterministic PRNG.
export function createRng(seed) {
  const state = { value: (typeof seed === "number" ? seed >>> 0 : hashSeed(seed)) >>> 0 };

  const next = () => {
    state.value |= 0;
    state.value = (state.value + 0x6d2b79f5) | 0;
    let t = Math.imul(state.value ^ (state.value >>> 15), 1 | state.value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int(min, max) {
      return Math.floor(next() * (max - min + 1)) + min;
    },
    pick(array) {
      return array[Math.floor(next() * array.length)];
    },
    chance(probability) {
      return next() < probability;
    },
  };
}
