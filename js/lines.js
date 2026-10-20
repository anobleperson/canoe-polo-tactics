import { el } from './svg.js';

const MIN_STEP = 0.15; // metres between recorded points
const MIN_LENGTH = 0.5; // shorter strokes (taps) are discarded
const TAIL = 0.6; // length used to set the arrowhead direction

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const toPoints = (pts) => pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

// Temporary freehand lines, drawn under the pieces. Never saved.
export class LineLayer {
  constructor(parent) {
    this.group = el('g', { id: 'lines' });
    parent.appendChild(this.group);
    this.active = new Map(); // pointerId -> { node, points, length }
  }

  static defs() {
    return el('marker', {
      id: 'arrow',
      viewBox: '0 0 10 10',
      refX: 5,
      refY: 5,
      markerWidth: 3.2,
      markerHeight: 3.2,
      orient: 'auto-start-reverse',
    }, [el('path', { d: 'M 0 0 L 10 5 L 0 10 z', class: 'arrow-head' })]);
  }

  get count() {
    return this.group.childElementCount;
  }

  start(pointerId, p) {
    const node = el('polyline', { class: 'stroke', points: toPoints([p]) });
    this.group.appendChild(node);
    this.active.set(pointerId, { node, points: [p], length: 0 });
  }

  extend(pointerId, p) {
    const line = this.active.get(pointerId);
    if (!line) return;
    const last = line.points[line.points.length - 1];
    const d = dist(last, p);
    if (d < MIN_STEP) return;
    line.points.push(p);
    line.length += d;
    line.node.setAttribute('points', toPoints(line.points));
  }

  end(pointerId) {
    const line = this.active.get(pointerId);
    if (!line) return;
    this.active.delete(pointerId);
    if (line.length < MIN_LENGTH) {
      line.node.remove();
      return;
    }
    // Drop points in the last TAIL metres so the arrowhead follows the overall
    // direction of the end of the stroke rather than hand jitter.
    const pts = line.points;
    const end = pts[pts.length - 1];
    let i = pts.length - 2;
    while (i > 0 && dist(pts[i], end) < TAIL) i--;
    const smoothed = [...pts.slice(0, i + 1), end];
    line.node.setAttribute('points', toPoints(smoothed));
    line.node.setAttribute('marker-end', 'url(#arrow)');
  }

  clear() {
    this.group.replaceChildren();
    this.active.clear();
  }
}
