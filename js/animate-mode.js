import { Animation, Player, DURATIONS } from './animation.js';
import { cloneState, sameState } from './state.js';
import { h, button, iconButton, setIcon, confirmDialog } from './ui.js';

// Animate mode: build a sequence of frames from board positions and play it.
//
// app provides:
//   state()          current board state
//   setState(s)      replace the board state and re-render
//   deselect()       clear the boat selection
//   onToggle(active) animate mode was entered or left
export class AnimateMode {
  constructor(bar, app) {
    this.bar = bar;
    this.app = app;
    this.active = false;
    this.anim = null;
    this.pos = 0; // current frame position; fractional while between frames
    this.savedJSON = null; // animation as last saved/loaded, to detect changes
    this.player = new Player((pos) => {
      this.pos = pos;
      this.app.setState(this.anim.stateAt(pos));
      this.update();
    });
    this.build();
  }

  build() {
    this.prevBtn = iconButton('prev', 'Previous frame', () => this.stepBack());
    this.playBtn = iconButton('play', 'Play', () => this.togglePlay(), { class: 'btn primary' });
    this.nextBtn = iconButton('next', 'Next frame', () => this.stepForward());
    this.status = h('div', { class: 'anim-status', role: 'status' });
    this.addBtn = button('+ Add frame', () => this.addFrame(), { class: 'btn primary' });
    this.updateBtn = button('Update frame', () => this.updateFrame());
    this.deleteBtn = button('Delete frame', () => this.deleteFrame());
    this.strip = h('div', { class: 'frame-strip', role: 'tablist', 'aria-label': 'Frames' });
    this.clearBtn = button('Clear', () => this.clear());
    this.speed = h(
      'select',
      { class: 'speed', 'aria-label': 'Time per frame' },
      DURATIONS.map((d) => h('option', { value: d, text: `${d}s / frame` })),
    );
    this.speed.addEventListener('change', () => {
      this.anim.duration = Number(this.speed.value);
      this.update();
    });

    this.bar.append(
      button('Done', () => this.exit()),
      h('div', { class: 'anim-transport' }, [this.prevBtn, this.playBtn, this.nextBtn, this.status]),
      this.strip,
      h('div', { class: 'anim-edit' }, [this.addBtn, this.updateBtn, this.deleteBtn, this.speed, this.clearBtn]),
    );
  }

  get playing() {
    return this.player.playing;
  }

  // Start animating. With no animation given, the current board becomes frame 1.
  enter(anim = null) {
    this.player.stop();
    this.anim = anim || new Animation(this.app.state());
    this.savedJSON = anim ? JSON.stringify(anim) : null;
    this.pos = 0;
    this.active = true;
    this.speed.value = this.anim.duration;
    this.app.setState(this.anim.stateAt(0));
    this.bar.hidden = false;
    this.app.onToggle(true);
    this.update();
  }

  async exit() {
    if (this.isDirty()) {
      const ok = await confirmDialog('Leave animation? Unsaved frames will be lost.', { ok: 'Leave', danger: true });
      if (!ok) return;
    }
    this.player.stop();
    this.active = false;
    this.anim = null;
    this.bar.hidden = true;
    this.app.onToggle(false);
  }

  isDirty() {
    if (!this.anim) return false;
    if (this.savedJSON === null) return this.anim.frames.length > 1;
    return JSON.stringify(this.anim) !== this.savedJSON;
  }

  markSaved() {
    this.savedJSON = JSON.stringify(this.anim);
  }

  atFrame() {
    return Number.isInteger(this.pos);
  }

  // The board has been moved since the frame it shows.
  boardModified() {
    if (!this.atFrame()) return true;
    return !sameState(this.app.state(), this.anim.frames[this.pos]);
  }

  // Add the board as a new frame after the current one (at the end when on
  // the last frame).
  addFrame() {
    if (this.playing) return;
    const at = Math.floor(this.pos) + 1;
    this.anim.frames.splice(at, 0, cloneState(this.app.state()));
    this.pos = at;
    this.update();
  }

  // Replace the current frame with the board as it is now.
  updateFrame() {
    if (this.playing || !this.atFrame()) return;
    this.anim.frames[this.pos] = cloneState(this.app.state());
    this.update();
  }

  deleteFrame() {
    if (this.playing || !this.atFrame() || this.anim.frames.length < 2) return;
    this.anim.frames.splice(this.pos, 1);
    this.showFrame(Math.min(this.pos, this.anim.last));
  }

  async clear() {
    if (this.playing) return;
    const ok = await confirmDialog('Clear all frames? The board as it is now becomes frame 1.', { ok: 'Clear', danger: true });
    if (!ok) return;
    this.anim.frames = [cloneState(this.app.state())];
    this.pos = 0;
    this.update();
  }

  showFrame(i) {
    this.player.stop();
    this.pos = i;
    this.app.setState(this.anim.stateAt(i));
    this.update();
  }

  togglePlay() {
    if (this.playing) {
      this.player.stop();
      this.update();
      return;
    }
    if (this.anim.frames.length < 2) return;
    // From the end, start again at frame 1.
    if (this.pos >= this.anim.last) this.showFrame(0);
    this.app.deselect();
    this.player.play(this.anim, this.pos, this.anim.last, () => this.update());
    this.update();
  }

  stepForward() {
    if (this.playing || this.pos >= this.anim.last) return;
    this.app.deselect();
    const target = this.atFrame() ? this.pos + 1 : Math.ceil(this.pos);
    this.player.play(this.anim, this.pos, target, () => this.update());
    this.update();
  }

  stepBack() {
    if (this.playing) return;
    const target = this.atFrame() ? this.pos - 1 : Math.floor(this.pos);
    if (target < 0) return;
    this.showFrame(target);
  }

  // Refresh the bar's buttons and status text.
  update() {
    if (!this.active) return;
    const n = this.anim.frames.length;
    const playing = this.playing;
    setIcon(this.playBtn, playing ? 'pause' : 'play', playing ? 'Pause' : 'Play');
    this.playBtn.disabled = n < 2;
    this.prevBtn.disabled = playing || this.pos <= 0;
    this.nextBtn.disabled = playing || this.pos >= this.anim.last;
    const modified = !playing && this.boardModified();
    this.addBtn.disabled = playing;
    this.updateBtn.disabled = playing || !this.atFrame() || !modified;
    this.deleteBtn.disabled = playing || !this.atFrame() || n < 2;
    this.clearBtn.disabled = playing;
    this.speed.disabled = playing;

    let text;
    if (this.atFrame()) text = `Frame ${this.pos + 1} of ${n}`;
    else text = `Frame ${Math.floor(this.pos) + 1}→${Math.ceil(this.pos) + 1} of ${n}`;
    if (modified) text += ' · moved, not added';
    this.status.textContent = text;
    this.updateStrip();
  }

  // Numbered chips, one per frame; tap to jump to that frame.
  updateStrip() {
    const n = this.anim.frames.length;
    while (this.strip.children.length < n) {
      const i = this.strip.children.length;
      this.strip.append(button(String(i + 1), () => this.showFrame(i), { class: 'btn chip', role: 'tab' }));
    }
    while (this.strip.children.length > n) this.strip.lastChild.remove();
    const current = Math.round(this.pos);
    [...this.strip.children].forEach((chip, i) => {
      const on = i === current && (this.atFrame() || this.playing);
      chip.classList.toggle('active', on);
      chip.setAttribute('aria-selected', on);
      chip.disabled = this.playing;
    });
    this.strip.children[current]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}
