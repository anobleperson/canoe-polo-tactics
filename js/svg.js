const NS = 'http://www.w3.org/2000/svg';

// Create an SVG element with attributes and optional children.
export function el(tag, attrs = {}, children = []) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  for (const child of children) node.appendChild(child);
  return node;
}

// Convert a pointer event's screen position to the local coordinates of an
// SVG element (the world group, i.e. pitch metres).
export function toSvgPoint(node, evt) {
  const pt = node.ownerSVGElement.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  const p = pt.matrixTransform(node.getScreenCTM().inverse());
  return { x: p.x, y: p.y };
}
