import { el } from './svg.js';

// All dimensions are in metres. Long axis is x (goal to goal).
export const PITCH = { length: 35, width: 23, goalWidth: 1.5, sixMetre: 6 };

// Space shown around the pitch so boats on the lines are fully visible.
const MARGIN = 1.5;

// Visible area for a court mode: { x, y, w, h }.
// Half court shows the right-hand (attacking) half with one goal.
export function viewRect(court) {
  const { length: L, width: W } = PITCH;
  if (court === 'half') {
    return { x: L / 2 - MARGIN, y: -MARGIN, w: L / 2 + 2 * MARGIN, h: W + 2 * MARGIN };
  }
  return { x: -MARGIN, y: -MARGIN, w: L + 2 * MARGIN, h: W + 2 * MARGIN };
}

// Screen rotation of the pitch: half court is turned so its goal is at the
// top, which fills a landscape screen better.
export function viewRotation(court) {
  return court === 'half' ? -90 : 0;
}

// world: the <g> holding pitch, lines and pieces (all in pitch metres).
export function applyView(svg, world, court) {
  const r = viewRect(court);
  svg.dataset.court = court;
  if (viewRotation(court) === -90) {
    // rotate(-90) maps (x, y) to (y, -x).
    world.setAttribute('transform', 'rotate(-90)');
    svg.setAttribute('viewBox', `${r.y} ${-(r.x + r.w)} ${r.h} ${r.w}`);
  } else {
    world.removeAttribute('transform');
    svg.setAttribute('viewBox', `${r.x} ${r.y} ${r.w} ${r.h}`);
  }
}

function goal(x, facing) {
  const { width: W, goalWidth: G } = PITCH;
  const y0 = W / 2 - G / 2;
  // Net drawn behind the goal line, crossbar on the line.
  return el('g', { class: 'goal' }, [
    el('rect', { x: facing > 0 ? x - 0.6 : x, y: y0, width: 0.6, height: G, class: 'goal-net' }),
    el('line', { x1: x, y1: y0, x2: x, y2: y0 + G, class: 'goal-bar' }),
  ]);
}

export function drawPitch() {
  const { length: L, width: W, sixMetre: S } = PITCH;
  return el('g', { id: 'pitch' }, [
    el('rect', { x: -50, y: -50, width: L + 100, height: W + 100, class: 'water' }),
    el('rect', { x: 0, y: 0, width: L, height: W, class: 'pitch-area' }),
    el('line', { x1: S, y1: 0, x2: S, y2: W, class: 'line six' }),
    el('line', { x1: L - S, y1: 0, x2: L - S, y2: W, class: 'line six' }),
    el('line', { x1: L / 2, y1: 0, x2: L / 2, y2: W, class: 'line halfway' }),
    el('circle', { cx: L / 2, cy: W / 2, r: 0.15, class: 'spot' }),
    el('rect', { x: 0, y: 0, width: L, height: W, class: 'line boundary' }),
    goal(0, 1),
    goal(L, -1),
    // Covers the unused half in half-court mode.
    el('rect', { x: -50, y: -50, width: 50 + L / 2 - MARGIN, height: W + 100, class: 'offview' }),
  ]);
}
