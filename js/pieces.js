import { el } from './svg.js';
import { BOAT } from './state.js';

const HL = BOAT.length / 2;
const HW = BOAT.width / 2;

// Distance from boat centre to the rotate handle, along the bow.
export const HANDLE_OFFSET = HL + 0.9;

// Top-down kayak, bow pointing +x. The bow is slightly finer than the stern
// so the direction of travel is readable.
const HULL_PATH = [
  `M ${HL} 0`,
  `C ${HL} ${-HW * 0.55}, ${HL * 0.55} ${-HW}, 0 ${-HW}`,
  `C ${-HL * 0.6} ${-HW}, ${-HL} ${-HW * 0.75}, ${-HL} 0`,
  `C ${-HL} ${HW * 0.75}, ${-HL * 0.6} ${HW}, 0 ${HW}`,
  `C ${HL * 0.55} ${HW}, ${HL} ${HW * 0.55}, ${HL} 0`,
  'Z',
].join(' ');

function paddle() {
  const reach = 1.05;
  const blade = (y) =>
    el('ellipse', { cx: 0.08, cy: y, rx: 0.1, ry: 0.22, class: 'paddle-blade' });
  return el('g', { class: 'paddle' }, [
    el('line', { x1: 0.08, y1: -reach, x2: 0.08, y2: reach, class: 'paddle-shaft' }),
    blade(-reach),
    blade(reach),
  ]);
}

function boatElement(piece) {
  const hull = el('g', { class: 'hull' }, [
    el('ellipse', { cx: 0, cy: 0, rx: HL + 0.25, ry: 1.0, class: 'hit' }),
    el('path', { d: HULL_PATH, class: 'select-ring' }),
    el('path', { d: HULL_PATH, class: 'hull-shape' }),
    el('ellipse', { cx: -0.05, cy: 0, rx: 0.5, ry: 0.27, class: 'cockpit' }),
    el('path', { d: `M ${HL - 0.35} 0 L ${HL - 0.05} 0`, class: 'bow-tip' }),
    paddle(),
    el('line', { x1: HL, y1: 0, x2: HANDLE_OFFSET, y2: 0, class: 'handle-arm' }),
    el('g', { class: 'handle', 'data-handle': piece.id, transform: `translate(${HANDLE_OFFSET} 0)` }, [
      el('circle', { cx: 0, cy: 0, r: 0.42, class: 'handle-bg' }),
      // Circular arrow icon.
      el('path', { d: 'M 0.2 -0.12 A 0.22 0.22 0 1 0 0.2 0.12', class: 'handle-icon' }),
      el('path', { d: 'M 0.2 -0.26 L 0.22 -0.08 L 0.06 -0.1', class: 'handle-icon' }),
    ]),
  ]);
  const node = el('g', { class: `piece boat team-${piece.team}`, 'data-id': piece.id }, [
    hull,
    el('circle', { cx: 0, cy: 0, r: 0.42, class: 'helmet' }),
    el('text', { x: 0, y: 0.02, class: 'number' }),
  ]);
  node.querySelector('.number').textContent = piece.number;
  return node;
}

function ballElement() {
  const r = 0.35;
  return el('g', { class: 'piece ball', 'data-id': 'ball' }, [
    el('circle', { cx: 0, cy: 0, r: 0.9, class: 'hit' }),
    el('circle', { cx: 0, cy: 0, r, class: 'ball-body' }),
    el('path', { d: `M ${-r} -0.1 Q 0 0.25 ${r} -0.1`, class: 'ball-seam' }),
    el('path', { d: `M -0.1 ${-r} Q 0.22 0 -0.1 ${r}`, class: 'ball-seam' }),
  ]);
}

// Keeps one SVG element per piece and updates transforms on render.
export class PieceLayer {
  constructor(parent) {
    this.group = el('g', { id: 'pieces' });
    parent.appendChild(this.group);
    this.nodes = new Map();
    this.selectedId = null;
  }

  // viewAngle: rotation of the whole view, so numbers can stay upright.
  render(state, viewAngle = 0) {
    const seen = new Set();
    for (const piece of state.pieces) {
      let node = this.nodes.get(piece.id);
      if (!node) {
        node = boatElement(piece);
        this.nodes.set(piece.id, node);
        this.group.appendChild(node);
      }
      node.setAttribute('transform', `translate(${piece.x} ${piece.y})`);
      node.querySelector('.hull').setAttribute('transform', `rotate(${piece.angle})`);
      node.querySelector('.number').setAttribute('transform', `rotate(${-viewAngle})`);
      node.classList.toggle('selected', piece.id === this.selectedId);
      seen.add(piece.id);
    }

    let ball = this.nodes.get('ball');
    if (!ball) {
      ball = ballElement();
      this.nodes.set('ball', ball);
      this.group.appendChild(ball);
    }
    ball.setAttribute('transform', `translate(${state.ball.x} ${state.ball.y})`);
    seen.add('ball');

    for (const [id, node] of this.nodes) {
      if (!seen.has(id)) {
        node.remove();
        this.nodes.delete(id);
      }
    }
  }

  // Draw a piece above the others (e.g. while dragging).
  raise(id) {
    const node = this.nodes.get(id);
    if (node) this.group.appendChild(node);
  }
}
