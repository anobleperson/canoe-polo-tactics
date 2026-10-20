import { toSvgPoint } from './svg.js';

const ROTATE_STEP = 15;
const NUDGE = 0.25;

const toDeg = (rad) => (rad * 180) / Math.PI;
export const normAngle = (a) => ((a % 360) + 360) % 360;

// Pointer, wheel and keyboard handling for the board.
//
// app provides:
//   state()            current board state
//   viewAngle()        screen rotation of the view in degrees
//   selectedId()       id of the selected boat or null
//   select(id)         select a boat (or null)
//   clamp(x, y)        keep a point inside the visible area
//   raise(id)          draw a piece on top
//   changed()          state was modified, re-render
//   mode()             'move' | 'draw'
//   lines              LineLayer (for draw mode), optional
//   onGestureEnd()     a drag/rotate finished (optional)
export function attachInput(svg, world, app) {
  // One entry per active pointer, so several fingers can act at once.
  const gestures = new Map();

  const findPiece = (state, id) =>
    id === 'ball' ? state.ball : state.pieces.find((p) => p.id === id);

  svg.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button > 0) return;
    const p = toSvgPoint(world, e);
    const state = app.state();

    if (app.mode() === 'draw' && app.lines) {
      svg.setPointerCapture(e.pointerId);
      app.lines.start(e.pointerId, p);
      gestures.set(e.pointerId, { kind: 'line' });
      e.preventDefault();
      return;
    }

    const handle = e.target.closest('[data-handle]');
    const pieceNode = e.target.closest('[data-id]');

    if (handle) {
      const id = handle.dataset.handle;
      gestures.set(e.pointerId, { kind: 'rotate', id });
    } else if (pieceNode) {
      const id = pieceNode.dataset.id;
      const piece = findPiece(state, id);
      gestures.set(e.pointerId, { kind: 'drag', id, dx: piece.x - p.x, dy: piece.y - p.y });
      app.raise(id);
      if (id !== 'ball') app.select(id);
    } else {
      app.select(null);
      return;
    }
    svg.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  svg.addEventListener('pointermove', (e) => {
    const g = gestures.get(e.pointerId);
    if (!g) return;
    const p = toSvgPoint(world, e);

    if (g.kind === 'line') {
      app.lines.extend(e.pointerId, p);
      return;
    }

    const piece = findPiece(app.state(), g.id);
    if (!piece) return;

    if (g.kind === 'drag') {
      const c = app.clamp(p.x + g.dx, p.y + g.dy);
      piece.x = c.x;
      piece.y = c.y;
    } else if (g.kind === 'rotate') {
      let a = toDeg(Math.atan2(p.y - piece.y, p.x - piece.x));
      if (e.shiftKey) a = Math.round(a / ROTATE_STEP) * ROTATE_STEP;
      piece.angle = normAngle(a);
    }
    app.changed();
  });

  const end = (e) => {
    const g = gestures.get(e.pointerId);
    if (!g) return;
    gestures.delete(e.pointerId);
    if (g.kind === 'line') app.lines.end(e.pointerId);
    else app.onGestureEnd?.();
  };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);

  // Mouse wheel over a boat rotates it.
  svg.addEventListener(
    'wheel',
    (e) => {
      const node = e.target.closest('[data-id]');
      const id = node?.dataset.id;
      if (!id || id === 'ball') return;
      e.preventDefault();
      const piece = findPiece(app.state(), id);
      piece.angle = normAngle(piece.angle + Math.sign(e.deltaY) * (e.shiftKey ? 5 : ROTATE_STEP));
      app.select(id);
      app.changed();
      app.onGestureEnd?.();
    },
    { passive: false },
  );

  // Keyboard: rotate / nudge the selected boat.
  window.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, dialog')) return;
    const id = app.selectedId();
    if (e.key === 'Escape') {
      app.select(null);
      return;
    }
    if (!id) return;
    const piece = findPiece(app.state(), id);
    const step = e.shiftKey ? 5 : ROTATE_STEP;
    const move = e.shiftKey ? 1 : NUDGE;
    // Arrow keys move in screen directions, so undo the view rotation.
    const nudge = (sx, sy) => {
      const a = (-app.viewAngle() * Math.PI) / 180;
      const dx = sx * Math.cos(a) - sy * Math.sin(a);
      const dy = sx * Math.sin(a) + sy * Math.cos(a);
      Object.assign(piece, app.clamp(piece.x + dx * move, piece.y + dy * move));
    };
    let handled = true;
    switch (e.key) {
      case 'q': case 'Q': case '[': piece.angle = normAngle(piece.angle - step); break;
      case 'e': case 'E': case ']': piece.angle = normAngle(piece.angle + step); break;
      case 'ArrowLeft': nudge(-1, 0); break;
      case 'ArrowRight': nudge(1, 0); break;
      case 'ArrowUp': nudge(0, -1); break;
      case 'ArrowDown': nudge(0, 1); break;
      default: handled = false;
    }
    if (handled) {
      e.preventDefault();
      app.changed();
      app.onGestureEnd?.();
    }
  });
}
