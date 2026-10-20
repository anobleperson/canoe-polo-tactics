import { drawPitch, applyView } from './pitch.js';

const svg = document.getElementById('board');

svg.appendChild(drawPitch());
applyView(svg, 'full');
