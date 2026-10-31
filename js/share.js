import { startingState, normaliseState } from './state.js';

// Share links: a setup or animation packed into the URL after "#share=".
// The part after # never leaves the browser, so this works on a static site
// and offline.
//
// Packed form (before compression):
//   { v: 1, k: 's' | 'a', n: name, c: 'f' | 'h', d?: duration, f: [frame, ...] }
// Each frame is a flat list of whole numbers in a fixed piece order:
//   x, y (decimetres) and angle (degrees) for each boat, then ball x, y.

const PREFIX = '#share=';
const ORDER = startingState().pieces.map((p) => p.id);

function packFrame(state) {
  const out = [];
  for (const id of ORDER) {
    const p = state.pieces.find((q) => q.id === id);
    out.push(Math.round(p.x * 10), Math.round(p.y * 10), Math.round(p.angle) % 360);
  }
  out.push(Math.round(state.ball.x * 10), Math.round(state.ball.y * 10));
  return out;
}

function unpackFrame(nums, court) {
  const pieces = ORDER.map((id, i) => ({ id, x: nums[i * 3] / 10, y: nums[i * 3 + 1] / 10, angle: nums[i * 3 + 2] }));
  const b = ORDER.length * 3;
  return normaliseState({ court, pieces, ball: { x: nums[b] / 10, y: nums[b + 1] / 10 } });
}

// --- bytes <-> URL-safe base64, with deflate where the browser supports it ---

const toB64 = (bytes) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64 = (s) =>
  Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function pipe(bytes, stream) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}

async function encode(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  if (typeof CompressionStream !== 'undefined') {
    return 'z' + toB64(await pipe(bytes, new CompressionStream('deflate-raw')));
  }
  return 'j' + toB64(bytes);
}

async function decode(text) {
  let bytes = fromB64(text.slice(1));
  if (text[0] === 'z') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
  else if (text[0] !== 'j') throw new Error('Unknown link format.');
  return JSON.parse(new TextDecoder().decode(bytes));
}

// --- public API ---

// kind: 'setups' | 'animations'; data as stored in the library.
export async function shareUrl(kind, name, data) {
  const packed =
    kind === 'setups'
      ? { v: 1, k: 's', n: name, c: data.court === 'half' ? 'h' : 'f', f: [packFrame(data)] }
      : {
          v: 1,
          k: 'a',
          n: name,
          c: data.frames[0].court === 'half' ? 'h' : 'f',
          d: data.duration,
          f: data.frames.map(packFrame),
        };
  const base = location.href.split('#')[0].split('?')[0];
  return base + PREFIX + (await encode(packed));
}

// Read a share link (a full URL or just its #share=... part).
// Returns { kind, name, data } or null if the text has no share data.
export async function readShare(text) {
  const i = text.indexOf(PREFIX);
  if (i < 0) return null;
  let p;
  try {
    p = await decode(text.slice(i + PREFIX.length).trim());
  } catch {
    p = null;
  }
  if (p?.v !== 1 || !Array.isArray(p.f) || !p.f.length) throw new Error('This link is damaged or incomplete.');
  const court = p.c === 'h' ? 'half' : 'full';
  const frames = p.f.map((f) => unpackFrame(f, court));
  const name = String(p.n || 'Shared').slice(0, 60);
  if (p.k === 's') return { kind: 'setups', name, data: frames[0] };
  return { kind: 'animations', name, data: { duration: p.d, frames } };
}

// Offer the link through the share sheet on touch devices, else copy it.
// Returns a short status message.
export async function sendLink(url, name) {
  if (matchMedia('(pointer: coarse)').matches && navigator.share) {
    try {
      await navigator.share({ title: `Canoe Polo Tactics: ${name}`, url });
      return `Shared a link to "${name}".`;
    } catch (err) {
      if (err.name === 'AbortError') return '';
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return `Link to "${name}" copied. Paste it into a message to send it.`;
  } catch {
    window.prompt('Copy this link:', url);
    return '';
  }
}
