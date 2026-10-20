import { drawPitch, applyView, viewRect } from './pitch.js';
import { startingState, sameState } from './state.js';
import { PieceLayer } from './pieces.js';
import { attachInput } from './input.js';
import { button, confirmDialog } from './ui.js';

const svg = document.getElementById('board');
const tools = document.getElementById('tools');

let state = startingState('full');
let mode = 'move';

svg.appendChild(drawPitch());
const pieces = new PieceLayer(svg);

function render() {
  applyView(svg, state.court);
  pieces.render(state);
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
  return !sameState(state, startingState(state.court));
}

async function reset() {
  if (boardChanged()) {
    const ok = await confirmDialog('Reset the board to the starting positions?', { ok: 'Reset', danger: true });
    if (!ok) return;
  }
  state = startingState(state.court);
  pieces.selectedId = null;
  render();
}

attachInput(svg, {
  state: () => state,
  selectedId: () => pieces.selectedId,
  select(id) {
    pieces.selectedId = id;
    render();
  },
  clamp,
  raise: (id) => pieces.raise(id),
  changed: render,
  mode: () => mode,
});

tools.append(button('Reset', reset));

render();
