import { drawPitch, applyView, viewRect } from './pitch.js';
import { startingState } from './state.js';
import { PieceLayer } from './pieces.js';
import { attachInput } from './input.js';

const svg = document.getElementById('board');

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

render();
