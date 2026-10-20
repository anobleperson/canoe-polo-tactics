import { drawPitch, applyView, viewRect, viewRotation } from './pitch.js';
import { el } from './svg.js';
import { startingState, sameState, cloneState, normaliseState } from './state.js';
import { PieceLayer } from './pieces.js';
import { attachInput } from './input.js';
import { LineLayer } from './lines.js';
import { openLibrary } from './library.js';
import { button, segmented, confirmDialog } from './ui.js';

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

function render() {
  applyView(svg, world, state.court);
  pieces.render(state, viewRotation(state.court));
}

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

function openSaved() {
  openLibrary([
    {
      kind: 'setups',
      title: 'Setups',
      getData: () => cloneState(state),
      onLoad: loadState,
      confirmLoad: boardChanged,
    },
  ]);
}

attachInput(svg, world, {
  state: () => state,
  viewAngle: () => viewRotation(state.court),
  selectedId: () => pieces.selectedId,
  select(id) {
    pieces.selectedId = id;
    render();
  },
  clamp,
  raise: (id) => pieces.raise(id),
  changed: render,
  mode: () => mode,
  lines,
});

const modeToggle = segmented([['move', 'Move'], ['draw', 'Draw']], mode, setMode);
const courtToggle = segmented([['full', 'Full'], ['half', 'Half']], state.court, setCourt);

tools.append(
  modeToggle.el,
  button('Clear lines', () => lines.clear()),
  courtToggle.el,
  button('Reset', reset),
  button('Saved', openSaved),
);

setMode('move');
