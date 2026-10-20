# Implementation Plan

Requirements: [requirements.md](requirements.md)

## How to use this plan

- Work through the steps in order. Each step should leave the app working.
- When a step is done, tick it (`[x]`) and commit the code and this file together.
- If a step is half done, add a short note under it saying what's left.
- To resume after an interruption, read this file, run `git log --oneline`, and continue from the first unticked step.

## Technical approach

- **No build step**: plain HTML, CSS and JavaScript (ES modules), served as static files so GitHub Pages can host it directly.
- **Rendering**: SVG. It scales cleanly to any screen or TV, and each piece is a DOM element that's easy to hit-test and transform.
- **Input**: Pointer Events (one code path for mouse, pen and touch; each finger has a `pointerId`, which supports multi-touch).
- **Coordinates**: everything is stored in pitch metres (35 × 23 m). The view maps metres to screen space, so full/half court is just a different view box with the same data.
- **State**: one plain JS object (`{ court, pieces: [{id, team, number, x, y, angle}], ball: {x, y} }`). It serialises straight to JSON for saving, export and animation frames.
- **Local testing**: `python3 tools/serve.py` from the repo root (a no-cache static server; ES modules do not load over `file://`).

### Planned file layout

```
index.html        app shell and toolbar
css/style.css
js/main.js        startup, wiring
js/state.js       board state, starting layout, (de)serialise
js/pitch.js       pitch drawing, full/half views
js/pieces.js      boat and ball rendering
js/input.js       drag, rotate, multi-touch
js/lines.js       freehand drawing layer
js/storage.js     localStorage save/load, JSON export/import
js/animation.js   frames, playback, interpolation
```

## Phase 1 — Tactics board

- [x] **1. Skeleton**: `index.html`, CSS and `main.js` with a full-screen SVG and an empty toolbar. Runs locally.
- [x] **2. Pitch**: draw the full-court pitch to scale (boundary, halfway line, 6 m lines, goals). Fits the screen in landscape and stays responsive.
- [x] **3. Pieces and starting state**: boat silhouette with a number, two team colours, ball. Render the starting layout from state.
- [x] **4. Drag to move**: move boats and the ball with mouse or one finger. Keep them within the pitch area.
- [x] **5. Rotate boats**: a rotate handle on the selected boat (works with mouse), plus mouse wheel or keyboard shortcut.
- [x] **6. Reset**: Reset button with confirmation if the board has changed. Clears lines.
- [x] **7. Half court**: toggle between full and half court. Pieces scale with the view. Reset layout for half court.
- [x] **8. Freehand lines**: draw mode toggle, freehand drawing, "Clear all lines". Lines are not part of saved state.
- [x] **9. Save/load setups**: named saves in localStorage, a list to load or delete.
- [x] **10. Export/import**: download and upload JSON files containing setups and animations.
- [x] **11. Touch-first polish**: large toolbar buttons, landscape iPad layout, no accidental page scroll/zoom, test on TV mirroring.
  - Done: 44px buttons, larger rotate-handle hit area, Safari zoom/long-press blocked, view auto-rotates to match screen shape (portrait phones get a rotated full court), D/C keyboard shortcuts, favicon.
  - Still to do: testing on a real iPad mirrored to a TV needs the deployed site (step 21).

## Phase 2 — Multi-touch (nice to have)

- [ ] **12. Multi-piece drag**: each finger moves its own piece at the same time.
- [ ] **13. Two-finger rotate**: rotate a boat with a two-finger twist.

## Phase 3 — Animation

- [ ] **14. Animate mode**: enter or exit from the current board. A frame strip shows the frame count and current frame.
- [ ] **15. Frames**: add frame (capture state), delete last frame, clear animation.
- [ ] **16. Playback**: play/pause with smooth interpolation of position and shortest-path rotation. Step forward and back. One configurable frame duration.
- [ ] **17. Continue after playback**: the board ends on the last frame, and adding a frame continues from there.
- [ ] **18. Save/load animations**: in localStorage, and included in export/import.

## Phase 4 — Frame editing (nice to have)

- [ ] **19. Jump to frame**: select any frame to view or edit it.
- [ ] **20. Insert/delete mid-sequence**: insert a frame after the current one, delete the current frame.

## Phase 5 — Deploy

- [ ] **21. GitHub Pages**: add a GitHub remote and push, turn on Pages, check it works on the iPad. Add a README with the URL and usage.
