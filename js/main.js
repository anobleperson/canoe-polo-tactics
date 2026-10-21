import { drawPitch, applyView, viewRect, viewRotation } from './pitch.js';
import { el } from './svg.js';
import { startingState, sameState, cloneState, normaliseState } from './state.js';
import { PieceLayer } from './pieces.js';
import { attachInput } from './input.js';
import { LineLayer } from './lines.js';
import { openLibrary } from './library.js';
import { Animation } from './animation.js';
import { AnimateMode } from './animate-mode.js';
import { h, button, segmented, confirmDialog } from './ui.js';

const svg = document.getElementById('board');
const tools = document.getElementById('tools');

let state = startingState('full');
let mode = 'move';

// Everything on the board lives in one group, in pitch metres.
const world = el('g', { id: 'world' });
svg.append(el('defs', {}, [LineLayer.defs()]), world);
world.appendChild(drawPitch());
const lines = new LineLayer(world);
const pieces = new PieceLayer(world);

const isLandscape = () => svg.clientWidth >= svg.clientHeight;
const rotation = () => viewRotation(state.court, isLandscape());

function render() {
  const angle = rotation();
  applyView(svg, world, state.court, angle);
  pieces.render(state, angle);
}

new ResizeObserver(render).observe(svg);

// Keep piece centres inside the visible area.
function clamp(x, y) {
  const r = viewRect(state.court);
  const inset = 0.4;
  return {
    x: Math.min(Math.max(x, r.x + inset), r.x + r.w - inset),
    y: Math.min(Math.max(y, r.y + inset), r.y + r.h - inset),
  };
}

function boardChanged() {
  return !sameState(state, startingState(state.court)) || lines.count > 0;
}

async function reset() {
  if (boardChanged()) {
    const ok = await confirmDialog('Reset the board to the starting positions?', { ok: 'Reset', danger: true });
    if (!ok) return;
  }
  state = startingState(state.court);
  pieces.selectedId = null;
  lines.clear();
  render();
}

function setMode(m) {
  mode = m;
  svg.dataset.mode = m;
  modeToggle.set(m);
  if (m === 'draw') pieces.selectedId = null;
  render();
}

// Switch between full and half court. An untouched board switches to that
// court's starting layout; otherwise pieces are kept and any outside the new
// view are pulled to its edge.
function setCourt(court) {
  if (court === state.court) return;
  if (!sameState(state, startingState(state.court))) {
    state.court = court;
    for (const p of [...state.pieces, state.ball]) Object.assign(p, clamp(p.x, p.y));
  } else {
    state = startingState(court);
  }
  lines.clear();
  courtToggle.set(court);
  render();
}

// Replace the board with a loaded state.
function loadState(data) {
  state = normaliseState(data);
  pieces.selectedId = null;
  lines.clear();
  courtToggle.set(state.court);
  render();
}

// Load a saved animation and enter animate mode with it.
function loadAnimation(data) {
  const anim = Animation.fromJSON(data);
  pieces.selectedId = null;
  lines.clear();
  animate.enter(anim);
}

function openSaved() {
  if (animate.active) {
    openLibrary([
      {
        kind: 'animations',
        title: 'Animations',
        getData: () => animate.anim.toJSON(),
        onSaved: () => animate.markSaved(),
        onLoad: loadAnimation,
        confirmLoad: () => animate.isDirty(),
      },
    ]);
    return;
  }
  openLibrary([
    {
      kind: 'setups',
      title: 'Setups',
      getData: () => cloneState(state),
      onLoad: loadState,
      confirmLoad: boardChanged,
    },
    { kind: 'animations', title: 'Animations', onLoad: loadAnimation, confirmLoad: boardChanged },
  ]);
}

const animate = new AnimateMode(document.getElementById('animbar'), {
  state: () => state,
  setState(s) {
    state = s;
    render();
  },
  deselect() {
    pieces.selectedId = null;
    render();
  },
  onToggle(active) {
    document.body.classList.toggle('animating', active);
    animateBtn.classList.toggle('active', active);
    for (const b of courtToggle.el.querySelectorAll('button')) b.disabled = active;
    resetBtn.disabled = active;
    courtToggle.set(state.court);
    render();
  },
});

attachInput(svg, world, {
  state: () => state,
  viewAngle: rotation,
  selectedId: () => pieces.selectedId,
  select(id) {
    pieces.selectedId = id;
    render();
  },
  clamp,
  raise: (id) => pieces.raise(id),
  changed() {
    render();
    animate.update();
  },
  mode: () => mode,
  locked: () => animate.playing,
  lines,
});

const modeToggle = segmented([['move', 'Move'], ['draw', 'Draw']], mode, setMode);
const courtToggle = segmented([['full', 'Full'], ['half', 'Half']], state.court, setCourt);

const resetBtn = button('Reset', reset);
const animateBtn = button('Animate', () => (animate.active ? animate.exit() : animate.enter()));

tools.append(
  modeToggle.el,
  button('Clear lines', () => lines.clear()),
  courtToggle.el,
  resetBtn,
  animateBtn,
  button('Saved', openSaved),
);

// Stop Safari page zoom and long-press menus on the board.
for (const type of ['gesturestart', 'gesturechange', 'contextmenu']) {
  svg.addEventListener(type, (e) => e.preventDefault());
}
document.addEventListener('dblclick', (e) => e.preventDefault());

// Keyboard shortcuts: D toggles draw mode, C clears lines.
window.addEventListener('keydown', (e) => {
  if (e.target.closest('input, textarea, dialog') || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'd' || e.key === 'D') setMode(mode === 'draw' ? 'move' : 'draw');
  else if (e.key === 'c' || e.key === 'C') lines.clear();
  else if (e.key === ' ' && animate.active) {
    e.preventDefault();
    animate.togglePlay();
  }
});

// Offline support. Skipped on localhost (unless ?sw is in the URL) so local
// edits aren't hidden behind the cache.
if ('serviceWorker' in navigator && (location.hostname !== 'localhost' || location.search.includes('sw'))) {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').catch(() => {});
  // A new version took over: offer a reload (the running page is still the old one).
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || document.querySelector('.update-toast')) return;
    document.body.append(
      h('div', { class: 'update-toast', role: 'status' }, [
        h('span', { text: 'A new version is ready.' }),
        button('Reload', () => location.reload(), { class: 'btn primary' }),
      ]),
    );
  });
  navigator.storage?.persist?.();
}

setMode('move');
