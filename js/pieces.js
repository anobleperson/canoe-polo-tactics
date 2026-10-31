import { el } from './svg.js';
import { BOAT } from './state.js';

const HL = BOAT.length / 2;
const HW = BOAT.width / 2;

// Distance from boat centre to the rotate handle, along the bow.
export const HANDLE_OFFSET = HL + 0.9;

// Top-down polo boat, bow pointing +x, origin at the paddler. The outlines
// below are measured from a photo of a real polo boat (scaled to 3 m long):
// [x, half-width] in metres, for one side, bow to stern. The widest point
// (0.61 m) is level with the back of the cockpit.
const BUMPER = 0.1; // length of the darker bumper at each end
const PADDLER_FORWARD = 0.1; // paddler's head is this far ahead of boat centre
const HULL_SIDE = [
  [1.5, 0], [1.496, 0.035], [1.492, 0.045], [1.484, 0.063], [1.471, 0.079],
  [1.455, 0.096], [1.439, 0.104], [1.41, 0.116], [1.378, 0.124], [1.317, 0.137],
  [1.255, 0.145], [1.133, 0.161], [1.011, 0.177], [0.889, 0.196], [0.644, 0.226],
  [0.399, 0.257], [0.155, 0.283], [-0.09, 0.302], [-0.151, 0.304], [-0.273, 0.298],
  [-0.518, 0.269], [-0.762, 0.234], [-1.007, 0.196], [-1.251, 0.157], [-1.374, 0.141],
  [-1.414, 0.128], [-1.435, 0.116], [-1.455, 0.104], [-1.471, 0.086], [-1.484, 0.067],
  [-1.492, 0.051], [-1.496, 0.033], [-1.5, 0],
];

// Cockpit: a blunt, narrower front; the sides angle out to a wide back that
// is flat across with rounded corners.
const COCKPIT_SIDE = [
  [0.564, 0], [0.562, 0.055], [0.558, 0.079], [0.554, 0.092], [0.546, 0.112],
  [0.53, 0.137], [0.497, 0.165], [0.465, 0.181], [0.399, 0.202], [0.334, 0.218],
  [0.269, 0.23], [0.204, 0.238], [0.139, 0.243], [0.073, 0.247], [0.008, 0.247],
  [-0.057, 0.247], [-0.09, 0.243], [-0.122, 0.234], [-0.155, 0.218], [-0.171, 0.206],
  [-0.188, 0.185], [-0.2, 0.165], [-0.212, 0.137], [-0.22, 0.11], [-0.224, 0.094],
  [-0.228, 0.069], [-0.23, 0],
];
const COCKPIT_FRONT = COCKPIT_SIDE[0][0];
const COCKPIT_BACK = COCKPIT_SIDE[COCKPIT_SIDE.length - 1][0];

// Smooth closed curve through points (Catmull-Rom spline as cubic Béziers).
function smoothClosedPath(pts) {
  const n = pts.length;
  const at = (i) => pts[(i + n) % n];
  const f = (v) => v.toFixed(3);
  let d = `M ${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${f(c1[0])} ${f(c1[1])}, ${f(c2[0])} ${f(c2[1])}, ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + ' Z';
}

// Mirror one side (bow to stern) into a closed outline.
const mirrored = (side) =>
  smoothClosedPath([
    ...side.map(([x, y]) => [x, -y]),
    ...side.slice(1, -1).reverse(),
  ]);

const HULL_PATH = mirrored(HULL_SIDE);
const COCKPIT_PATH = mirrored(COCKPIT_SIDE);

// Arrowhead on the foredeck pointing towards the bow.
const BOW_ARROW = `M 1.2 0 L 0.8 -0.11 L 0.88 0 L 0.8 0.11 Z`;

// Shared clip path so the bumpers follow the hull outline.
export function pieceDefs() {
  return el('clipPath', { id: 'hull-clip' }, [el('path', { d: HULL_PATH })]);
}

// Paddle across the boat: 2 m tip to tip, with blades about 44 cm long.
const PADDLE = { length: 2, bladeLength: 0.44, bladeWidth: 0.18 };

function paddle() {
  const tip = PADDLE.length / 2;
  const bladeCentre = tip - PADDLE.bladeLength / 2;
  const blade = (y) =>
    el('ellipse', { cx: 0.08, cy: y, rx: PADDLE.bladeWidth / 2, ry: PADDLE.bladeLength / 2, class: 'paddle-blade' });
  return el('g', { class: 'paddle' }, [
    el('line', { x1: 0.08, y1: -bladeCentre, x2: 0.08, y2: bladeCentre, class: 'paddle-shaft' }),
    blade(-bladeCentre),
    blade(bladeCentre),
  ]);
}

function boatElement(piece) {
  const hull = el('g', { class: 'hull' }, [
    el('ellipse', { cx: 0, cy: 0, rx: HL + 0.25, ry: 1.0, class: 'hit' }),
    // The boat sits slightly behind the paddler, whose head is forward of
    // the back of the cockpit.
    el('g', { transform: `translate(${-PADDLER_FORWARD} 0)` }, [
      el('path', { d: HULL_PATH, class: 'select-ring' }),
      el('path', { d: HULL_PATH, class: 'hull-shape' }),
      el('g', { 'clip-path': 'url(#hull-clip)' }, [
        el('rect', { x: HL - BUMPER, y: -HW, width: BUMPER, height: 2 * HW, class: 'bumper' }),
        el('rect', { x: -HL, y: -HW, width: BUMPER, height: 2 * HW, class: 'bumper' }),
      ]),
      el('line', { x1: COCKPIT_FRONT, y1: 0, x2: HL - BUMPER, y2: 0, class: 'deck-ridge' }),
      el('line', { x1: COCKPIT_BACK, y1: 0, x2: -HL + BUMPER, y2: 0, class: 'deck-ridge' }),
      el('path', { d: COCKPIT_PATH, class: 'cockpit' }),
      el('path', { d: BOW_ARROW, class: 'bow-arrow' }),
    ]),
    paddle(),
    el('line', { x1: HL, y1: 0, x2: HANDLE_OFFSET, y2: 0, class: 'handle-arm' }),
    el('g', { class: 'handle', 'data-handle': piece.id, transform: `translate(${HANDLE_OFFSET} 0)` }, [
      el('circle', { cx: 0, cy: 0, r: 0.9, class: 'hit' }),
      el('circle', { cx: 0, cy: 0, r: 0.42, class: 'handle-bg' }),
      // Circular arrow icon.
      el('path', { d: 'M 0.2 -0.12 A 0.22 0.22 0 1 0 0.2 0.12', class: 'handle-icon' }),
      el('path', { d: 'M 0.2 -0.26 L 0.22 -0.08 L 0.06 -0.1', class: 'handle-icon' }),
    ]),
  ]);
  const node = el('g', { class: `piece boat team-${piece.team}`, 'data-id': piece.id }, [
    hull,
    el('circle', { cx: 0, cy: 0, r: 0.27, class: 'helmet' }),
    el('text', { x: 0, y: 0.02, class: 'number' }),
  ]);
  node.querySelector('.number').textContent = piece.number;
  return node;
}

function ballElement() {
  const r = 0.35;
  return el('g', { class: 'piece ball', 'data-id': 'ball' }, [
    el('circle', { cx: 0, cy: 0, r: 0.65, class: 'hit' }),
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

  // Draw a piece above the other boats (e.g. while dragging). The ball always
  // stays on top so it can't get lost under a boat.
  raise(id) {
    const node = this.nodes.get(id);
    if (node) this.group.appendChild(node);
    const ball = this.nodes.get('ball');
    if (ball && id !== 'ball') this.group.appendChild(ball);
  }
}
