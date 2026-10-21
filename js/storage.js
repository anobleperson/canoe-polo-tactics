// Saved setups and animations, exportable as JSON.
//
// Saves live in IndexedDB, which iOS writes to disk before a save completes.
// A copy is also kept in localStorage; on startup whichever copy is newer is
// used, so if one of them loses data (localStorage in iOS home-screen apps
// can drop recent writes) the other restores it.
//
// Stored shape:
// { updatedAt, setups: [{ name, savedAt, data }], animations: [{ name, savedAt, data }] }

const KEY = 'canoe-polo-tactics.v1';
const APP_ID = 'canoe-polo-tactics';
const DB_NAME = 'canoe-polo-tactics';
const DB_STORE = 'library';
export const KINDS = ['setups', 'animations'];

const empty = () => ({ updatedAt: '', setups: [], animations: [] });

function clean(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;
  return {
    updatedAt: parsed.updatedAt || '',
    setups: Array.isArray(parsed.setups) ? parsed.setups : [],
    animations: Array.isArray(parsed.animations) ? parsed.animations : [],
  };
}

const count = (lib) => (lib ? lib.setups.length + lib.animations.length : 0);

// --- IndexedDB (one record holding the whole library) ---

let dbPromise = null;
function openDb() {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function idbRead() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).get(KEY);
    req.onsuccess = () => resolve(clean(req.result));
    req.onerror = () => reject(req.error);
  });
}

async function idbWrite(lib) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite', { durability: 'strict' });
    tx.objectStore(DB_STORE).put(lib, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

// --- localStorage copy ---

function lsRead() {
  try {
    return clean(JSON.parse(localStorage.getItem(KEY) || 'null'));
  } catch {
    return null;
  }
}

function lsWrite(lib) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lib));
  } catch {
    // Storage full or unavailable; IndexedDB still has it.
  }
}

// --- In-memory library, loaded once at startup ---

let lib = empty();

// Pick the newer of the two copies (an empty or missing copy never wins over
// one with saves), then make both copies match it.
export const ready = (async () => {
  const fromLs = lsRead();
  let fromDb = null;
  try {
    fromDb = await idbRead();
  } catch {
    // IndexedDB unavailable (e.g. some private modes): localStorage only.
  }
  const candidates = [fromDb, fromLs].filter((c) => count(c) > 0);
  candidates.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  lib = candidates[0] || fromDb || fromLs || empty();
  await persist().catch(() => {});
})();

async function persist() {
  lsWrite(lib);
  await idbWrite(lib);
}

function read() {
  return lib;
}

// Replace the library and save both copies. Resolves once IndexedDB has it.
async function write(next) {
  lib = { ...next, updatedAt: new Date().toISOString() };
  try {
    await persist();
  } catch {
    // IndexedDB failed; the localStorage copy was still written.
  }
}

export function counts() {
  return { setups: lib.setups.length, animations: lib.animations.length };
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
export async function put(kind, name, data) {
  const next = { ...read() };
  next[kind] = next[kind].filter((item) => item.name !== name);
  next[kind].push({ name, savedAt: new Date().toISOString(), data });
  await write(next);
}

export async function remove(kind, name) {
  const next = { ...read() };
  next[kind] = next[kind].filter((item) => item.name !== name);
  await write(next);
}

// Save items as one JSON file: everything by default, or a single item when
// kind and itemName are given. On touch devices (iPad/iPhone, where home-screen
// apps ignore downloads) this opens the share sheet, so the file can go to
// Files, AirDrop, Mail, etc. Returns false if the user cancelled.
export async function exportFile(kind = null, itemName = null) {
  let items = { setups: read().setups, animations: read().animations };
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
  const next = { ...read(), setups: [...read().setups], animations: [...read().animations] };
  const added = { setups: 0, animations: 0 };
  for (const kind of KINDS) {
    for (const item of payload[kind] || []) {
      if (!item?.name || !item.data) continue;
      const same = next[kind].find((x) => x.name === item.name);
      if (same && JSON.stringify(same.data) === JSON.stringify(item.data)) continue;
      let name = item.name;
      for (let n = 2; next[kind].some((x) => x.name === name); n++) name = `${item.name} (${n})`;
      next[kind].push({ ...item, name });
      added[kind]++;
    }
  }
  await write(next);
  return added;
}
