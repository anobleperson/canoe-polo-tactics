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
  - **Half court**: one fixed attacking half with a single goal, zoomed in.
- Boats, players and ball scale to match the selected mode (bigger in half court).

### Pieces
- **Two teams of 5 players**, shown as top-down silhouette canoe polo boats, each team in its own colour.
- Each boat shows a **player number (1–5)**.
- **One ball** (water polo style), separate from the players.
- Pieces can be:
  - **Moved** by dragging.
  - **Rotated** (boats only) to show which way they face.

### Lines / Annotations
- Draw **temporary freehand lines** to show the direction of travel for players or the ball. Keep it simple: no straight-line, arrow-style or colour options.
- A **Clear all lines** button removes every line.
- Lines are for live explaining only. They are **never saved** in setups or animations.

### Save / Load
- Save the current board setup (piece positions, rotations, court mode) under a name.
- Load a saved setup later.
- Delete saved setups.
- Saves are kept in the browser (localStorage).
- **Export / import** setups and animations as a JSON file, to back up or share with teammates and other devices.

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

### Frame controls
- **Essential (first version)**: add frame, delete last frame, play/pause, step forward/back, clear animation.
- **Frame timing**: one configurable duration that applies to every frame transition (no per-frame durations).
- **Nice to have (later)**: jump to any frame to edit it, and insert or delete frames in the middle.

## Non-Functional Requirements

- **Self-contained**: static HTML/CSS/JS with no server-side code. Works when served from GitHub Pages.
- **Hosting**: deploy via GitHub Pages from this repository.
- **Primary device**: tablet (iPad, landscape) connected to a TV. Design touch-first with large, clear controls and a pitch that fills the screen.
- **Also supported**: laptop/desktop with keyboard and mouse. Phone should work, but it is not the focus.
- **Persistence**: browser localStorage, plus JSON file export/import.

## Decisions Log

| Topic | Decision |
|---|---|
| Team size | 5 per team, no subs bench |
| Storage | Browser localStorage + JSON export/import |
| Lines | Freehand only, with "clear all" |
| Boat labels | Numbers 1–5 |
| Lines persistence | Never saved (setups or animations) |
| Half court | One fixed attacking half |
| Frame editing | Basic first; full editing is nice to have. One global frame duration |
| Main device | Tablet to TV, touch-first; mouse/keyboard also supported |
