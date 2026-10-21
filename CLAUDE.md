# Canoe Polo Tactics Board

Static, no-build web app (HTML/CSS/ES modules, SVG rendering) hosted on GitHub Pages.

- Requirements: `docs/requirements.md`
- Plan and progress: `docs/plan.md`. **Read this first.** Continue from the first unticked step.

## Working rules

- Finish one plan step at a time, tick it in `docs/plan.md`, and commit the code and the plan together.
- If you stop partway through a step, add a note under it in the plan saying what's left.
- If the requirements change, update `docs/requirements.md` (including the Decisions Log) and commit.
- Run locally with `python3 tools/serve.py` (no-cache server) and open http://localhost:8000.
- Offline support: `sw.js` lists every app file and has a content-hash version. After changing or adding app files, run `python3 tools/update-sw.py` (the pre-commit hook does this when `git config core.hooksPath tools/hooks` is set). New file types must be added to `PATTERNS` in that script.
- The service worker only registers on localhost with `?sw` in the URL. Unregister it afterwards so it doesn't cache local edits.
- Primary target is an iPad in landscape mirrored to a TV, so design touch-first. Mouse and keyboard must also work.
