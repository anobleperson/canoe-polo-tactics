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
- **Save / Load**: name and save the board, then load, export or delete each save. **Export all** puts every setup and animation in one file, and **Import** adds the saves from a file. On an iPad/iPhone, exporting opens the share sheet (Save to Files, AirDrop, Mail and so on).

**Animate**
1. Press **Animate**. The current board becomes frame 1.
2. Move the pieces and press **+ Add frame**. Repeat.
3. **Play** (or Space) animates through the frames. Afterwards you can keep adding frames.
4. Tap a numbered frame chip to jump to it. **Update frame** saves changes to that frame, **Delete frame** removes it, and **+ Add frame** inserts after it.
5. Set the time per frame with the speed menu.
6. Save the animation from **Save / Load** while in animate mode. Press **Done** to return to the board.

Saves are kept in this browser's local storage. Use **Export all** to keep a backup.

## Running locally

```bash
python3 tools/serve.py
```

Then open http://localhost:8000. Offline caching is turned off on localhost (add `?sw` to the URL to test it).

After changing app files, regenerate the offline file list (`python3 tools/update-sw.py`), or enable the pre-commit hook that does it for you:

```bash
git config core.hooksPath tools/hooks
```

## Deploying to GitHub Pages

1. Push this repository to GitHub.
2. In the repository, go to **Settings → Pages**, set **Source** to "Deploy from a branch", choose `main` and `/ (root)`, then save.
3. The site appears at `https://<username>.github.io/<repository>/` after a minute or two.

## Offline use (iPad / iPhone)

1. While online, open the live site in Safari.
2. Tap **Share → Add to Home Screen**.
3. Open it once from the home-screen icon while still online, so it can save itself for offline use.

After that it opens full screen from the icon and works with no internet connection. When you're back online it fetches updates in the background, and a "new version is ready" notice offers a reload.

**Saves on iOS:** the home-screen app keeps its own saved setups and animations, separate from Safari's. To move saves between them, or between devices, use **Save / Load → Export all** and **Import**.

## Project docs

- [Requirements](docs/requirements.md)
- [Implementation plan and progress](docs/plan.md)
