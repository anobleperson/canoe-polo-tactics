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
//   onSaved?(name)   called after saving
//   onLoad(data)     load the item; may return false to keep the dialog open
//   confirmLoad?()   true if loading would discard unsaved changes
// }]
export async function openLibrary(sections) {
  await storage.ready;
  const status = h('p', { class: 'library-status', role: 'status' });
  const body = h('div', { class: 'library-body' });
  // No file-type filter: iOS often tags a saved .json file as plain text and
  // would grey it out. The contents are checked on import instead.
  const fileInput = h('input', { type: 'file', hidden: '' });

  const dlg = h('dialog', { class: 'modal library' }, [
    h('div', { class: 'library-header' }, [
      h('h2', { text: 'Save / Load' }),
      button('Close', () => dlg.close(), { class: 'btn' }),
    ]),
    body,
    status,
    h('div', { class: 'library-footer' }, [
      button('Export all', async () => {
        const c = storage.counts();
        const n = c.setups + c.animations;
        if (!n) {
          status.textContent = 'Nothing saved yet to export.';
          return;
        }
        if (await storage.exportFile()) status.textContent = `Exported ${n} item(s) to one file.`;
      }),
      button('Import', () => fileInput.click()),
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
        await storage.put(sec.kind, name, sec.getData());
        sec.onSaved?.(name);
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
              button('Export', async () => {
                if (await storage.exportFile(sec.kind, item.name)) status.textContent = `Exported "${item.name}".`;
              }),
              button('Delete', async () => {
                const ok = await confirmDialog(`Delete "${item.name}"?`, { ok: 'Delete', danger: true });
                if (!ok) return;
                await storage.remove(sec.kind, item.name);
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
  const c = storage.counts();
  status.textContent = `${c.setups} setup(s) and ${c.animations} animation(s) saved on this device.`;
  dlg.addEventListener('close', () => dlg.remove());
  document.body.append(dlg);
  dlg.showModal();
}
