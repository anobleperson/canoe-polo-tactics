# Canoe Polo Tactics Board — Requirements

## Overview

A self-contained website for demonstrating canoe polo tactics to a team, similar in spirit to the iOS app "Coach Tactic Board: Soccer". It runs entirely in the browser with no backend, and is hosted for free on GitHub Pages.

## Goals

- Quickly set up and explain tactical positions on a canoe polo pitch.
- Work well on desktop (mouse) and touch devices (tablet/phone).
- Need no server, account or install. Open the URL and use it.

## Priority 1 — Tactics Board

### Pitch
- Draw a canoe polo pitch with the standard markings (boundaries, halfway line, goal areas/6 m lines, goals).
- Two display modes:
  - **Full court**: the whole pitch.
  - **Half court**: one fixed attacking half with a single goal, zoomed in. It is turned so the goal is at the top, which fills a landscape screen.
- Boats, players and ball scale to match the selected mode (bigger in half court).

### Pieces
- **Two teams of 5 players**, shown as top-down silhouette canoe polo boats, each team in its own colour.
- Each boat shows a **player number (1–5)**.
- **One ball** (water polo style), separate from the players.
- Pieces can be:
  - **Moved** by dragging.
  - **Rotated** (boats only) to show which way they face.

### Reset Board
- A **Reset** button puts the board back to the starting state, like a match start-up:
  - Each team's 5 boats lined up along its own end of the pitch (one team on the left, one on the right), facing towards the centre.
  - The ball in the middle of the pitch.
- In half-court mode, reset uses the same layout scaled to fit: one team along the goal line, the other along the halfway line, and the ball midway between them.
- Reset clears all drawn lines.
- Ask for confirmation before resetting if the board has been changed, so a stray tap doesn't wipe a setup.
- The app opens in this starting state.

### Lines / Annotations
- Draw **temporary freehand lines** to show the direction of travel for players or the ball. Keep it simple: no straight-line, arrow-style or colour options.
- Each line automatically ends in an arrowhead to show direction.
- A **Clear all lines** button removes every line. Lines are also cleared on reset and when switching court.
- Lines are for live explaining only. They are **never saved** in setups or animations.

### Save / Load
- Save the current board setup (piece positions, rotations, court mode) under a name.
- Load a saved setup later.
- Delete saved setups.
- Saves are kept on the device (IndexedDB, with a localStorage copy).
- **Export / import** as a JSON file, to back up or share with teammates and other devices: **Export** on a single saved setup or animation, or **Export all** for everything in one file. **Import** merges a file's saves in. On iPad/iPhone, export opens the share sheet, because home-screen apps can't download files.

### Touch Support (nice to have)
- Multi-touch gestures:
  - Two-finger rotate on a boat.
  - Move more than one piece at once (one finger per piece).

## Priority 2 — Animation

- Enter **animate mode** from the current board state.
- **Add frame**: capture the current positions as a keyframe.
- Move pieces, add another frame, and repeat.
- **Playback**: smoothly animate (interpolate) pieces between frames in order.
- After playback, the user can **continue adding frames** from the last frame.
- **Save** an animation and **load** it later for playback.

### Behaviour details
- Entering animate mode makes the current board **frame 1** automatically.
- **Next frame** animates the move to the next frame. **Previous frame** jumps straight back.
- **Play** from the last frame starts again at frame 1. Space bar toggles play/pause.
- The status shows the current frame, and warns when pieces have been moved but not added as a frame.
- While animating, court size and Reset are locked. Lines can still be drawn.
- Leaving animate mode asks for confirmation if there are unsaved frames.
- Saved animations can be loaded from the board (this enters animate mode) or from within animate mode.

### Frame controls
- Add frame (inserted after the current frame), update frame, delete frame, play/pause, step forward/back, clear animation.
- A strip of numbered frame chips: tap one to jump to that frame and edit it.
- **Frame timing**: one configurable duration that applies to every frame transition (no per-frame durations).

## Non-Functional Requirements

- **Self-contained**: static HTML/CSS/JS with no server-side code. Works when served from GitHub Pages.
- **Hosting**: deploy via GitHub Pages from this repository.
- **Primary device**: tablet (iPad, landscape) connected to a TV. Design touch-first with large, clear controls and a pitch that fills the screen.
- **Also supported**: laptop/desktop with keyboard and mouse. Phone should work, but it is not the focus.
- **Persistence**: saves are stored in IndexedDB (written to disk before a save completes), with a copy in localStorage. On startup the newer copy is used, so losing either one doesn't lose saves. JSON file export/import for backups.
- **Offline**: once opened online, the app works with no connection, including from an iPhone/iPad home-screen icon. Updates download automatically next time it's online, and a "new version is ready" notice offers a reload.

## Decisions Log

| Topic | Decision |
|---|---|
| Team size | 5 per team, no subs bench |
| Storage | IndexedDB + localStorage copy, JSON export/import (single item or all) |
| Lines | Freehand only, with "clear all" |
| Boat labels | Numbers 1–5 |
| Lines persistence | Never saved (setups or animations) |
| Half court | One fixed attacking half |
| Frame editing | Full editing (jump, insert, update, delete). One global frame duration |
| Reset | Boats lined up at each end facing in, ball centre; confirm before reset |
| Offline | Service worker caches all app files; installable to home screen |
| Main device | Tablet to TV, touch-first; mouse/keyboard also supported |
