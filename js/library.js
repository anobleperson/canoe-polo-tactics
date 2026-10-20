import { h, button, confirmDialog } from './ui.js';
import * as storage from './storage.js';

const fmtDate = (iso) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

// Dialog for saving, loading, deleting, exporting and importing.
//
// sections: [{
//   kind: 'setups' | 'animations',
//   title,
//   getData?()       data to save; omit to hide the save row
//   onLoad(data)     load the item; may return false to keep the dialog open
//   confirmLoad?()   true if loading would discard unsaved changes
// }]
export function openLibrary(sections) {
  const status = h('p', { class: 'library-status', role: 'status' });
  const body = h('div', { class: 'library-body' });
  const fileInput = h('input', { type: 'file', accept: '.json,application/json', hidden: '' });

  const dlg = h('dialog', { class: 'modal library' }, [
    h('div', { class: 'library-header' }, [
      h('h2', { text: 'Saved' }),
      button('Close', () => dlg.close(), { class: 'btn' }),
    ]),
    body,
    status,
    h('div', { class: 'library-footer' }, [
      button('Export file', () => {
        storage.exportFile();
        status.textContent = 'Exported all setups and animations.';
      }),
      button('Import file', () => fileInput.click()),
      fileInput,
    ]),
  ]);

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    fileInput.value = '';
    if (!file) return;
    try {
      const n = await storage.importFile(file);
      status.textContent = `Imported ${n.setups} setup(s) and ${n.animations} animation(s).`;
      draw();
    } catch (err) {
      status.textContent = `Import failed: ${err.message}`;
    }
  });

  function sectionView(sec) {
    const items = storage.list(sec.kind);
    const parts = [h('h3', { text: sec.title })];

    if (sec.getData) {
      const input = h('input', { type: 'text', placeholder: 'Name', maxlength: '60', enterkeyhint: 'done' });
      const save = async () => {
        const name = input.value.trim();
        if (!name) {
          input.focus();
          return;
        }
        if (storage.exists(sec.kind, name)) {
          const ok = await confirmDialog(`Replace the saved "${name}"?`, { ok: 'Replace' });
          if (!ok) return;
        }
        storage.put(sec.kind, name, sec.getData());
        status.textContent = `Saved "${name}".`;
        draw();
      };
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') save();
      });
      parts.push(h('div', { class: 'save-row' }, [input, button('Save', save, { class: 'btn primary' })]));
    }

    if (!items.length) {
      parts.push(h('p', { class: 'empty', text: 'Nothing saved yet.' }));
    } else {
      parts.push(
        h(
          'ul',
          { class: 'saved-list' },
          items.map((item) =>
            h('li', {}, [
              h('div', { class: 'saved-name' }, [
                h('strong', { text: item.name }),
                h('small', { text: fmtDate(item.savedAt) }),
              ]),
              button('Load', async () => {
                if (sec.confirmLoad?.()) {
                  const ok = await confirmDialog(`Load "${item.name}"? Unsaved changes on the board will be lost.`, { ok: 'Load' });
                  if (!ok) return;
                }
                if (sec.onLoad(storage.get(sec.kind, item.name)) !== false) dlg.close();
              }),
              button('Delete', async () => {
                const ok = await confirmDialog(`Delete "${item.name}"?`, { ok: 'Delete', danger: true });
                if (!ok) return;
                storage.remove(sec.kind, item.name);
                status.textContent = `Deleted "${item.name}".`;
                draw();
              }, { class: 'btn danger-outline' }),
            ]),
          ),
        ),
      );
    }
    return h('section', {}, parts);
  }

  function draw() {
    body.replaceChildren(...sections.map(sectionView));
  }

  draw();
  dlg.addEventListener('close', () => dlg.remove());
  document.body.append(dlg);
  dlg.showModal();
}
