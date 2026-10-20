// Small DOM helpers for the toolbar and dialogs.

export function h(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'onclick') node.addEventListener('click', v);
    else if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v);
  }
  for (const child of [].concat(children)) {
    if (child == null) continue;
    node.append(child);
  }
  return node;
}

export function button(label, onClick, attrs = {}) {
  return h('button', { type: 'button', class: 'btn', onclick: onClick, text: label, ...attrs });
}

// A group of mutually exclusive buttons. Returns { el, set(value) }.
export function segmented(options, value, onChange) {
  const buttons = new Map();
  const el = h('div', { class: 'segmented', role: 'group' });
  const set = (v) => {
    for (const [val, b] of buttons) {
      b.classList.toggle('active', val === v);
      b.setAttribute('aria-pressed', val === v);
    }
  };
  for (const [val, label] of options) {
    const b = button(label, () => onChange(val));
    buttons.set(val, b);
    el.append(b);
  }
  set(value);
  return { el, set };
}

// Modal dialog with a message and buttons. Resolves to true if confirmed.
export function confirmDialog(message, { ok = 'OK', cancel = 'Cancel', danger = false } = {}) {
  return new Promise((resolve) => {
    const dlg = h('dialog', { class: 'modal' }, [
      h('p', { text: message }),
      h('div', { class: 'modal-actions' }, [
        button(cancel, () => dlg.close('cancel')),
        button(ok, () => dlg.close('ok'), { class: danger ? 'btn danger' : 'btn primary' }),
      ]),
    ]);
    dlg.addEventListener('close', () => {
      resolve(dlg.returnValue === 'ok');
      dlg.remove();
    });
    document.body.append(dlg);
    dlg.showModal();
  });
}
