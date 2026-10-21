// Saved setups and animations, kept in localStorage and exportable as JSON.
//
// Stored shape:
// { setups: [{ name, savedAt, data }], animations: [{ name, savedAt, data }] }

const KEY = 'canoe-polo-tactics.v1';
const APP_ID = 'canoe-polo-tactics';
export const KINDS = ['setups', 'animations'];

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { setups: parsed.setups || [], animations: parsed.animations || [] };
  } catch {
    return { setups: [], animations: [] };
  }
}

function write(lib) {
  localStorage.setItem(KEY, JSON.stringify(lib));
}

export function list(kind) {
  return read()[kind].slice().sort((a, b) => a.name.localeCompare(b.name));
}

export function exists(kind, name) {
  return read()[kind].some((item) => item.name === name);
}

export function get(kind, name) {
  return read()[kind].find((item) => item.name === name)?.data;
}

// Save (or overwrite) an item by name.
export function put(kind, name, data) {
  const lib = read();
  lib[kind] = lib[kind].filter((item) => item.name !== name);
  lib[kind].push({ name, savedAt: new Date().toISOString(), data });
  write(lib);
}

export function remove(kind, name) {
  const lib = read();
  lib[kind] = lib[kind].filter((item) => item.name !== name);
  write(lib);
}

// Save items as one JSON file: everything by default, or a single item when
// kind and itemName are given. On touch devices (iPad/iPhone, where home-screen
// apps ignore downloads) this opens the share sheet, so the file can go to
// Files, AirDrop, Mail, etc. Returns false if the user cancelled.
export async function exportFile(kind = null, itemName = null) {
  let items = read();
  let name = `canoe-polo-tactics-${new Date().toISOString().slice(0, 10)}.json`;
  if (kind) {
    items = { setups: [], animations: [] };
    items[kind] = read()[kind].filter((item) => item.name === itemName);
    const slug = itemName.replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '') || 'item';
    name = `canoe-polo-${slug}.json`;
  }
  const payload = { app: APP_ID, version: 1, exportedAt: new Date().toISOString(), ...items };
  const json = JSON.stringify(payload, null, 2);

  const file = new File([json], name, { type: 'application/json' });
  if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Canoe Polo Tactics saves' });
      return true;
    } catch (err) {
      if (err.name === 'AbortError') return false;
      // Sharing failed for another reason: fall back to a download.
    }
  }

  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

// Merge items from an exported file. Items whose name is taken by different
// content are imported under a new name, e.g. "Press (2)".
// Returns { setups: n, animations: n } counts of imported items.
export async function importFile(file) {
  let payload;
  try {
    payload = JSON.parse(await file.text());
  } catch {
    payload = null;
  }
  if (payload?.app !== APP_ID) throw new Error('This is not a Canoe Polo Tactics file.');
  const lib = read();
  const counts = { setups: 0, animations: 0 };
  for (const kind of KINDS) {
    for (const item of payload[kind] || []) {
      if (!item?.name || !item.data) continue;
      const same = lib[kind].find((x) => x.name === item.name);
      if (same && JSON.stringify(same.data) === JSON.stringify(item.data)) continue;
      let name = item.name;
      for (let n = 2; lib[kind].some((x) => x.name === name); n++) name = `${item.name} (${n})`;
      lib[kind].push({ ...item, name });
      counts[kind]++;
    }
  }
  write(lib);
  return counts;
}
