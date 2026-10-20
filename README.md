# Canoe Polo Tactics

A tactics board for canoe polo coaching that runs in the browser. Move two teams of boats and the ball around a pitch, draw movement lines, save setups, and build animated plays.

It is a static site (HTML, CSS and JavaScript with no build step), so it can be hosted free on GitHub Pages.

**Live site:** https://anobleperson.github.io/canoe-polo-tactics/

## Using it

**Board**
- **Drag** a boat or the ball to move it. Several fingers can move several pieces at once.
- **Rotate** a boat by dragging the round handle in front of the selected boat. You can also hold the boat with one finger and twist with a second finger, use the mouse wheel over it, or press `Q`/`E` (`[`/`]`). Add Shift for fine steps.
- **Arrow keys** nudge the selected boat.
- **Draw** mode: drag to draw freehand arrows. **Clear lines** (or `C`) removes them. `D` toggles draw mode. Lines are never saved.
- **Full / Half** switches court size. Half court shows the attacking half with the goal at the top.
- **Reset** returns to the start-up line-up (asks first if anything has moved).
- **Saved**: name and save the board, load or delete saves, and **Export file** / **Import file** to back them up or share them with another device.

**Animate**
1. Press **Animate**. The current board becomes frame 1.
2. Move the pieces and press **+ Add frame**. Repeat.
3. **Play** (or Space) animates through the frames. Afterwards you can keep adding frames.
4. Tap a numbered frame chip to jump to it. **Update frame** saves changes to that frame, **Delete frame** removes it, and **+ Add frame** inserts after it.
5. Set the time per frame with the speed menu.
6. Save the animation from **Saved** while in animate mode. Press **Done** to return to the board.

Saves are kept in this browser's local storage. Use **Export file** to keep a backup.

## Running locally

```bash
python3 tools/serve.py
```

Then open http://localhost:8000.

## Deploying to GitHub Pages

1. Push this repository to GitHub.
2. In the repository, go to **Settings → Pages**, set **Source** to "Deploy from a branch", choose `main` and `/ (root)`, then save.
3. The site appears at `https://<username>.github.io/<repository>/` after a minute or two.

On an iPad, open the site in Safari and use **Share → Add to Home Screen** so it opens full screen like an app.

## Project docs

- [Requirements](docs/requirements.md)
- [Implementation plan and progress](docs/plan.md)
