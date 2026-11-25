import { PALETTES } from './patterns.js';
import {
  GENERATIVE_FAMILIES,
  describeProceduralCard,
  randomSeedCode,
  renderProceduralSvg,
} from './procedural.js';

const STORAGE_KEY = 'contrastplay_deck_v3';

const MOTION_MODES = ['off', 'drift', 'breathe', 'spin'];

const MOTION_SHORT_LABELS = { off: 'Motion', drift: 'Drift', breathe: 'Breathe', spin: 'Spin' };

const COMPLEXITY_LABELS = {
  1: '1 · Simple',
  2: '2 · Early',
  3: '3 · Balanced',
  4: '4 · Detailed',
  5: '5 · Explorer',
};

const STARTER_DECK = [
  { seed: 'STAR-482', family: 'truchet', paletteId: 'bwr', complexity: 3, invert: false, showBorder: true },
  { seed: 'BEAR-205', family: 'creature', paletteId: 'bwr', complexity: 3, invert: false, showBorder: true },
  { seed: 'MOON-719', family: 'bauhaus', paletteId: 'bwr', complexity: 3, invert: false, showBorder: true },
  { seed: 'WAVE-308', family: 'mandala', paletteId: 'bw', complexity: 3, invert: false, showBorder: true },
];

const state = {
  family: 'auto',
  seed: 'STAR-482',
  paletteId: 'bwr',
  complexity: 3,
  invert: false,
  showBorder: true,
  motion: 'off',
  playing: false,
  intervalSec: 10,
  timerId: null,
  history: [],
  discovery: [],
  deck: loadDeck(),
  activeSheet: null, // 'options' | 'export' | null
};

const els = {
  seedPill: document.getElementById('seed-pill'),
  cardPreview: document.getElementById('card-preview'),
  gestureHint: document.getElementById('gesture-hint'),
  btnPrev: document.getElementById('btn-prev'),
  btnPlay: document.getElementById('btn-play'),
  playIcon: document.getElementById('play-icon'),
  playLabel: document.getElementById('play-label'),
  intervalSlider: document.getElementById('interval-slider'),
  intervalValue: document.getElementById('interval-value'),
  btnOpenOptions: document.getElementById('btn-open-options'),
  btnCloseOptions: document.getElementById('btn-close-options'),
  optionsDrawer: document.getElementById('options-drawer'),
  btnOpenExport: document.getElementById('btn-open-export'),
  btnCloseExport: document.getElementById('btn-close-export'),
  exportModal: document.getElementById('export-modal'),
  exportCardTitle: document.getElementById('export-card-title'),
  btnOpenGuide: document.getElementById('btn-open-guide'),
  btnCloseGuide: document.getElementById('btn-close-guide'),
  guideModal: document.getElementById('guide-modal'),
  btnQuickMotion: document.getElementById('btn-quick-motion'),
  quickMotionLabel: document.getElementById('quick-motion-label'),
  btnQuickInvert: document.getElementById('btn-quick-invert'),
  btnQuickFrame: document.getElementById('btn-quick-frame'),
  deckDot: document.getElementById('deck-dot'),
  backdrop: document.getElementById('backdrop'),
  seedInput: document.getElementById('seed-input'),
  btnNewSeed: document.getElementById('btn-new-seed'),
  familyGrid: document.getElementById('family-grid'),
  paletteGrid: document.getElementById('palette-grid'),
  densitySteps: document.getElementById('density-steps'),
  complexityLabel: document.getElementById('complexity-label'),
  toggleInvert: document.getElementById('toggle-invert'),
  toggleBorder: document.getElementById('toggle-border'),
  motionGrid: document.getElementById('motion-grid'),
  discoveryGrid: document.getElementById('discovery-grid'),
  btnRollFeed: document.getElementById('btn-roll-feed'),
  btnDownloadPng: document.getElementById('btn-download-png'),
  btnDownloadSvg: document.getElementById('btn-download-svg'),
  btnCopyLink: document.getElementById('btn-copy-link'),
  btnAddDeck: document.getElementById('btn-add-deck'),
  deckCount: document.getElementById('deck-count'),
  deckStrip: document.getElementById('deck-strip'),
  btnDeckMix: document.getElementById('btn-deck-mix'),
  btnDeckClear: document.getElementById('btn-deck-clear'),
  btnPrint: document.getElementById('btn-print'),
  printSheets: document.getElementById('print-sheets'),
  toast: document.getElementById('toast'),
};

let toastTimer = null;
function showToast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.add('hidden'), 2000);
}

function loadDeck() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return STARTER_DECK.map((c) => ({ ...c }));
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((c) => c && c.seed);
  } catch {
    // Ignore storage errors
  }
  return STARTER_DECK.map((c) => ({ ...c }));
}

function saveDeck() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.deck));
  } catch {
    // Ignore storage errors
  }
}

function currentCardSpec() {
  return {
    seed: state.seed,
    family: state.family,
    paletteId: state.paletteId,
    complexity: state.complexity,
    invert: state.invert,
    showBorder: state.showBorder,
  };
}

function renderCard(card, size, clipId) {
  return renderProceduralSvg({
    seed: card.seed || 'STAR-101',
    family: card.family || 'auto',
    paletteId: card.paletteId || 'bwr',
    complexity: card.complexity ?? 3,
    invert: Boolean(card.invert),
    showBorder: card.showBorder !== false,
    size,
    clipId,
  });
}

function syncHashFromState() {
  const params = new URLSearchParams();
  params.set('seed', state.seed);
  if (state.family !== 'auto') params.set('style', state.family);
  params.set('palette', state.paletteId);
  params.set('c', String(state.complexity));
  if (state.invert) params.set('inv', '1');
  if (!state.showBorder) params.set('border', '0');
  if (state.motion !== 'off') params.set('anim', state.motion);
  const nextHash = `#${params.toString()}`;
  if (window.location.hash !== nextHash) {
    history.replaceState(null, '', nextHash);
  }
}

function hydrateStateFromHash() {
  const raw = window.location.hash.replace(/^#/, '');
  if (!raw) return;
  const params = new URLSearchParams(raw);
  const seed = params.get('seed');
  if (seed && seed.trim()) state.seed = seed.trim();
  const style = params.get('style') || params.get('family');
  if (style && GENERATIVE_FAMILIES.some((f) => f.id === style)) state.family = style;
  const pal = params.get('palette');
  if (pal && PALETTES[pal]) state.paletteId = pal;
  const c = Number(params.get('c'));
  if (Number.isInteger(c) && c >= 1 && c <= 5) state.complexity = c;
  if (params.has('inv')) state.invert = params.get('inv') === '1';
  if (params.has('border')) state.showBorder = params.get('border') !== '0';
  const anim = params.get('anim');
  if (MOTION_MODES.includes(anim)) state.motion = anim;
}

function generateNewSeed(recordHistory = true) {
  if (recordHistory) {
    state.history.push(currentCardSpec());
    if (state.history.length > 30) state.history.shift();
  }
  state.seed = randomSeedCode();
  els.cardPreview.classList.add('pulse');
  setTimeout(() => els.cardPreview.classList.remove('pulse'), 140);
  els.gestureHint.classList.add('faded');
  renderStage();
  renderDiscovery();
}

function stepBackHistory() {
  if (state.history.length === 0) return;
  const prev = state.history.pop();
  state.seed = prev.seed;
  state.family = prev.family;
  state.paletteId = prev.paletteId;
  state.complexity = prev.complexity;
  state.invert = prev.invert;
  state.showBorder = prev.showBorder;
  renderStage();
  renderDiscovery();
}

function restartTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
  if (state.playing) {
    state.timerId = setInterval(() => {
      generateNewSeed(true);
    }, state.intervalSec * 1000);
  }
}

function setPlaying(next) {
  state.playing = next;
  els.btnPlay.classList.toggle('playing', state.playing);
  els.btnPlay.setAttribute('aria-pressed', String(state.playing));
  els.playIcon.textContent = state.playing ? '⏸' : '▶';
  els.playLabel.textContent = state.playing ? 'Pause' : 'Play';
  restartTimer();
}

function openSheet(which) {
  state.activeSheet = which;
  els.backdrop.classList.remove('hidden');
  els.optionsDrawer.classList.toggle('hidden', which !== 'options');
  els.exportModal.classList.toggle('hidden', which !== 'export');
  els.guideModal.classList.toggle('hidden', which !== 'guide');
  els.btnOpenOptions.setAttribute('aria-expanded', String(which === 'options'));
  if (which === 'export') {
    const info = describeProceduralCard(state.seed, state.family);
    els.exportCardTitle.textContent = info.title;
    renderDeck();
  }
}

function closeSheets() {
  state.activeSheet = null;
  els.backdrop.classList.add('hidden');
  els.optionsDrawer.classList.add('hidden');
  els.exportModal.classList.add('hidden');
  els.guideModal.classList.add('hidden');
  els.btnOpenOptions.setAttribute('aria-expanded', 'false');
}

function buildFamilyGrid() {
  els.familyGrid.innerHTML = '';
  for (const fam of GENERATIVE_FAMILIES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'family-btn';
    btn.dataset.familyId = fam.id;
    btn.setAttribute('role', 'radio');
    btn.textContent = fam.name;
    btn.addEventListener('click', () => {
      state.family = fam.id;
      rollDiscoveryFeed();
      renderStage();
    });
    els.familyGrid.appendChild(btn);
  }
}

function buildPaletteGrid() {
  els.paletteGrid.innerHTML = '';
  for (const pal of Object.values(PALETTES)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'palette-btn';
    btn.dataset.paletteId = pal.id;
    btn.setAttribute('role', 'radio');
    const swatches = [pal.bg, pal.fg, pal.accent]
      .filter((col, idx, arr) => idx < 2 || col !== arr[1])
      .map((col) => `<span class="swatch" style="background:${col}"></span>`)
      .join('');
    btn.innerHTML = `
      <div class="palette-swatches">${swatches}</div>
      <span class="palette-label">${pal.name}</span>
      <span class="palette-hint">${pal.ageHint}</span>
    `;
    btn.addEventListener('click', () => {
      state.paletteId = pal.id;
      syncDiscoveryStyles();
      renderStage();
      renderDiscovery();
    });
    els.paletteGrid.appendChild(btn);
  }
}

function rollDiscoveryFeed() {
  state.discovery = Array.from({ length: 6 }, () => ({
    seed: randomSeedCode(),
    family: state.family,
    paletteId: state.paletteId,
    complexity: state.complexity,
    invert: state.invert,
    showBorder: state.showBorder,
  }));
  renderDiscovery();
}

function syncDiscoveryStyles() {
  state.discovery = state.discovery.map((card) => ({
    ...card,
    paletteId: state.paletteId,
    complexity: state.complexity,
    invert: state.invert,
    showBorder: state.showBorder,
  }));
}

function renderStage() {
  const card = currentCardSpec();
  els.cardPreview.innerHTML = renderCard(card, 900, 'stage-main');
  els.cardPreview.classList.remove('anim-drift', 'anim-breathe', 'anim-spin');
  els.cardPreview.classList.toggle('is-animated', state.motion !== 'off');
  if (state.motion !== 'off') els.cardPreview.classList.add(`anim-${state.motion}`);
  els.seedPill.textContent = state.seed;
  if (document.activeElement !== els.seedInput) {
    els.seedInput.value = state.seed;
  }
  els.btnPrev.disabled = state.history.length === 0;

  els.complexityLabel.textContent = COMPLEXITY_LABELS[state.complexity] || String(state.complexity);
  for (const btn of els.densitySteps.querySelectorAll('.step-btn')) {
    btn.classList.toggle('active', Number(btn.dataset.level) === state.complexity);
  }
  els.toggleInvert.checked = state.invert;
  els.toggleBorder.checked = state.showBorder;

  for (const btn of els.familyGrid.querySelectorAll('.family-btn')) {
    const active = btn.dataset.familyId === state.family;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-checked', String(active));
  }
  for (const btn of els.paletteGrid.querySelectorAll('.palette-btn')) {
    const active = btn.dataset.paletteId === state.paletteId;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-checked', String(active));
  }
  for (const btn of els.motionGrid.querySelectorAll('.motion-btn')) {
    const active = btn.dataset.motion === state.motion;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-checked', String(active));
  }

  els.btnQuickMotion.classList.toggle('active', state.motion !== 'off');
  els.btnQuickMotion.setAttribute('aria-pressed', String(state.motion !== 'off'));
  els.quickMotionLabel.textContent = MOTION_SHORT_LABELS[state.motion] || 'Motion';
  els.btnQuickInvert.classList.toggle('active', state.invert);
  els.btnQuickInvert.setAttribute('aria-pressed', String(state.invert));
  els.btnQuickFrame.classList.toggle('active', state.showBorder);
  els.btnQuickFrame.setAttribute('aria-pressed', String(state.showBorder));

  syncHashFromState();
}

function renderDiscovery() {
  els.discoveryGrid.innerHTML = '';
  state.discovery.forEach((card, idx) => {
    const info = describeProceduralCard(card.seed, card.family);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mini-seed-card';
    btn.title = info.title;
    btn.classList.toggle('active', state.seed === card.seed && state.family === card.family);
    btn.innerHTML = `<div class="mini-seed-art">${renderCard(card, 180, `disc-${idx}`)}</div>`;
    btn.addEventListener('click', () => {
      state.history.push(currentCardSpec());
      if (state.history.length > 30) state.history.shift();
      state.seed = card.seed;
      state.family = card.family;
      renderStage();
      renderDiscovery();
    });
    els.discoveryGrid.appendChild(btn);
  });
}

function renderDeck() {
  els.deckCount.textContent = String(state.deck.length);
  els.deckDot.classList.toggle('hidden', state.deck.length === 0);
  els.deckStrip.innerHTML = '';

  if (state.deck.length === 0) {
    els.deckStrip.innerHTML = '<div class="deck-empty">No saved cards yet. Tap "Save to Print Deck" above.</div>';
    renderPrintSheets();
    return;
  }

  state.deck.forEach((card, idx) => {
    const info = describeProceduralCard(card.seed, card.family);
    const item = document.createElement('div');
    item.className = 'deck-item';
    item.title = info.title;
    item.innerHTML = `
      <button class="deck-remove" type="button" aria-label="Remove ${info.title}">✕</button>
      <div class="deck-thumb">${renderCard(card, 180, `deck-${idx}`)}</div>
    `;
    item.addEventListener('click', (ev) => {
      if (ev.target.closest('.deck-remove')) return;
      state.seed = card.seed;
      state.family = card.family || 'auto';
      state.paletteId = card.paletteId || 'bwr';
      state.complexity = card.complexity ?? 3;
      state.invert = Boolean(card.invert);
      state.showBorder = card.showBorder !== false;
      renderStage();
      renderDiscovery();
      closeSheets();
    });
    item.querySelector('.deck-remove').addEventListener('click', (ev) => {
      ev.stopPropagation();
      state.deck.splice(idx, 1);
      saveDeck();
      renderDeck();
    });
    els.deckStrip.appendChild(item);
  });

  renderPrintSheets();
}

function renderPrintSheets() {
  const cards = state.deck.length > 0 ? state.deck : [currentCardSpec()];
  els.printSheets.innerHTML = '';
  for (let i = 0; i < cards.length; i += 4) {
    const page = document.createElement('div');
    page.className = 'print-page';
    const slice = cards.slice(i, i + 4);
    for (let slotIdx = 0; slotIdx < slice.length; slotIdx++) {
      const slot = document.createElement('div');
      slot.className = 'print-card';
      slot.innerHTML = renderCard(slice[slotIdx], 800, `print-${i + slotIdx}`);
      page.appendChild(slot);
    }
    els.printSheets.appendChild(page);
  }
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportSlug() {
  const info = describeProceduralCard(state.seed, state.family);
  return `contrastplay-${info.familyId}-${state.seed}-${state.paletteId}`
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-');
}

function downloadSvg() {
  const svg = renderCard(currentCardSpec(), 1200, 'export-svg');
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  triggerDownload(blob, `${exportSlug()}.svg`);
  showToast('SVG downloaded');
}

function downloadPng() {
  const exportSize = 1800; // 6x6 in @ 300 DPI
  const svg = renderCard(currentCardSpec(), exportSize, 'export-png');
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = exportSize;
    canvas.height = exportSize;
    canvas.getContext('2d').drawImage(img, 0, 0, exportSize, exportSize);
    URL.revokeObjectURL(url);
    canvas.toBlob((pngBlob) => {
      if (pngBlob) {
        triggerDownload(pngBlob, `${exportSlug()}.png`);
        showToast('PNG downloaded (300 DPI)');
      }
    }, 'image/png');
  };
  img.onerror = () => URL.revokeObjectURL(url);
  img.src = url;
}

// Double-click (desktop) & reliable double-tap (touch devices) on the pattern
let lastTapAt = 0;
els.cardPreview.addEventListener('dblclick', (ev) => {
  ev.preventDefault();
  generateNewSeed(true);
  if (state.playing) restartTimer();
});

els.cardPreview.addEventListener(
  'touchend',
  (ev) => {
    if (ev.touches.length > 0) return;
    const now = Date.now();
    if (now - lastTapAt > 40 && now - lastTapAt < 340) {
      ev.preventDefault();
      lastTapAt = 0;
      generateNewSeed(true);
      if (state.playing) restartTimer();
    } else {
      lastTapAt = now;
    }
  },
  { passive: false }
);

// Bottom Player Events
els.btnPlay.addEventListener('click', () => setPlaying(!state.playing));
els.btnPrev.addEventListener('click', () => {
  stepBackHistory();
  if (state.playing) restartTimer();
});

els.intervalSlider.addEventListener('input', () => {
  state.intervalSec = Number(els.intervalSlider.value);
  els.intervalValue.textContent = `${state.intervalSec}s`;
  if (state.playing) restartTimer();
});

// Sheet Open / Close
els.btnOpenOptions.addEventListener('click', () =>
  state.activeSheet === 'options' ? closeSheets() : openSheet('options')
);
els.btnCloseOptions.addEventListener('click', closeSheets);
els.btnOpenExport.addEventListener('click', () =>
  state.activeSheet === 'export' ? closeSheets() : openSheet('export')
);
els.btnCloseExport.addEventListener('click', closeSheets);
els.btnOpenGuide.addEventListener('click', () =>
  state.activeSheet === 'guide' ? closeSheets() : openSheet('guide')
);
els.btnCloseGuide.addEventListener('click', closeSheets);
els.btnQuickMotion.addEventListener('click', () => {
  state.motion = MOTION_MODES[(MOTION_MODES.indexOf(state.motion) + 1) % MOTION_MODES.length];
  renderStage();
  showToast(`Motion: ${state.motion === 'off' ? 'Off' : MOTION_SHORT_LABELS[state.motion]}`);
});
els.btnQuickInvert.addEventListener('click', () => {
  state.invert = !state.invert;
  syncDiscoveryStyles();
  renderStage();
  renderDiscovery();
});
els.btnQuickFrame.addEventListener('click', () => {
  state.showBorder = !state.showBorder;
  syncDiscoveryStyles();
  renderStage();
  renderDiscovery();
});
els.backdrop.addEventListener('click', closeSheets);

// Options Events
els.seedInput.addEventListener('input', () => {
  const val = els.seedInput.value.trim();
  if (!val) return;
  state.seed = val;
  renderStage();
  renderDiscovery();
});

els.btnNewSeed.addEventListener('click', () => generateNewSeed(true));
els.btnRollFeed.addEventListener('click', rollDiscoveryFeed);

els.densitySteps.addEventListener('click', (ev) => {
  const btn = ev.target.closest('.step-btn');
  if (!btn) return;
  state.complexity = Number(btn.dataset.level);
  syncDiscoveryStyles();
  renderStage();
  renderDiscovery();
});

els.toggleInvert.addEventListener('change', () => {
  state.invert = els.toggleInvert.checked;
  syncDiscoveryStyles();
  renderStage();
  renderDiscovery();
});

els.toggleBorder.addEventListener('change', () => {
  state.showBorder = els.toggleBorder.checked;
  syncDiscoveryStyles();
  renderStage();
  renderDiscovery();
});

els.motionGrid.addEventListener('click', (ev) => {
  const btn = ev.target.closest('.motion-btn');
  if (!btn || !MOTION_MODES.includes(btn.dataset.motion)) return;
  state.motion = btn.dataset.motion;
  renderStage();
});

// Export & Deck Events
els.btnDownloadPng.addEventListener('click', downloadPng);
els.btnDownloadSvg.addEventListener('click', downloadSvg);

els.btnCopyLink.addEventListener('click', async () => {
  syncHashFromState();
  try {
    await navigator.clipboard.writeText(window.location.href);
    showToast('Share link copied');
  } catch {
    showToast('URL updated in address bar');
  }
});

els.btnAddDeck.addEventListener('click', () => {
  state.deck.push(currentCardSpec());
  saveDeck();
  renderDeck();
  showToast(`Saved ${state.seed} to print deck`);
});

els.btnDeckMix.addEventListener('click', () => {
  state.deck = Array.from({ length: 4 }, () => ({
    seed: randomSeedCode(),
    family: state.family,
    paletteId: state.paletteId,
    complexity: state.complexity,
    invert: state.invert,
    showBorder: state.showBorder,
  }));
  saveDeck();
  renderDeck();
  showToast('Filled deck with 4 fresh cards');
});

els.btnDeckClear.addEventListener('click', () => {
  state.deck = [];
  saveDeck();
  renderDeck();
});

els.btnPrint.addEventListener('click', () => {
  renderPrintSheets();
  closeSheets();
  window.print();
});

// Keyboard Shortcuts
document.addEventListener('keydown', (ev) => {
  const inInput = ev.target && (ev.target.tagName === 'INPUT' || ev.target.tagName === 'SELECT');
  if (ev.key === 'Escape' && state.activeSheet) {
    closeSheets();
    return;
  }
  if (inInput || state.activeSheet) return;

  if (ev.key === ' ') {
    ev.preventDefault();
    setPlaying(!state.playing);
  } else if (ev.key === 'ArrowRight' || ev.key === 'Enter') {
    generateNewSeed(true);
    if (state.playing) restartTimer();
  } else if (ev.key === 'ArrowLeft') {
    stepBackHistory();
    if (state.playing) restartTimer();
  }
});

// Boot
hydrateStateFromHash();
buildFamilyGrid();
buildPaletteGrid();
rollDiscoveryFeed();
renderStage();
renderDeck();

// Gently fade the double-tap hint after a few seconds
setTimeout(() => els.gestureHint.classList.add('faded'), 4500);
