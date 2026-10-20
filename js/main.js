import { drawPitch, applyView } from './pitch.js';
import { startingState } from './state.js';
import { PieceLayer } from './pieces.js';

const svg = document.getElementById('board');

let state = startingState('full');

svg.appendChild(drawPitch());
const pieces = new PieceLayer(svg);

function render() {
  applyView(svg, state.court);
  pieces.render(state);
}

render();
