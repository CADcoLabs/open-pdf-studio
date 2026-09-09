// Copyright (c) 2026 Barry Adams / CADcoLabs. All rights reserved.
//
// Converts parsed DXF entities (LINE, CIRCLE, ARC, LWPOLYLINE) into a
// clean, self-contained SVG matching this app's built-in symbol
// convention (viewBox 0 0 64 64, no scripts/external refs). Pure
// functions only -- no filesystem access -- so this is node-testable in
// isolation. The filesystem-walking generator lives in generate.mjs.

import DxfParser from 'dxf-parser';

const SUPPORTED_TYPES = new Set(['LINE', 'CIRCLE', 'ARC', 'LWPOLYLINE']);

function computeBounds(entities) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const grow = (x, y, r = 0) => {
    minX = Math.min(minX, x - r);
    minY = Math.min(minY, y - r);
    maxX = Math.max(maxX, x + r);
    maxY = Math.max(maxY, y + r);
  };
  for (const e of entities) {
    if (e.type === 'LINE') {
      for (const v of e.vertices) grow(v.x, v.y);
    } else if (e.type === 'CIRCLE' || e.type === 'ARC') {
      grow(e.center.x, e.center.y, e.radius);
    } else if (e.type === 'LWPOLYLINE') {
      for (const v of e.vertices) grow(v.x, v.y);
    }
  }
  return { minX, minY, maxX, maxY };
}

// Fits `bounds` into a `size`x`size` box with `padding` on every side,
// flipping Y (DXF is Y-up, SVG is Y-down) via a negative Y scale. Returns
// a function mapping a raw DXF (x,y) to SVG-space (x,y).
function fitTransform(bounds, size, padding) {
  const w = bounds.maxX - bounds.minX || 1;
  const h = bounds.maxY - bounds.minY || 1;
  const available = size - padding * 2;
  const scale = Math.min(available / w, available / h);
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;
  const mid = size / 2;
  return (x, y) => ({
    x: mid + (x - cx) * scale,
    y: mid - (y - cy) * scale, // the minus sign is the Y-flip
  });
}

function fmt(n) {
  return Math.round(n * 1000) / 1000;
}

function lineToSvg(e, tx) {
  const [a, b] = e.vertices;
  const p1 = tx(a.x, a.y);
  const p2 = tx(b.x, b.y);
  return `<line x1="${fmt(p1.x)}" y1="${fmt(p1.y)}" x2="${fmt(p2.x)}" y2="${fmt(p2.y)}"/>`;
}

function circleToSvg(e, tx, scale) {
  const c = tx(e.center.x, e.center.y);
  return `<circle cx="${fmt(c.x)}" cy="${fmt(c.y)}" r="${fmt(e.radius * scale)}"/>`;
}

// Converts one circular arc (shared by ARC entities and LWPOLYLINE bulge
// segments) to an SVG `A` path command. `startAngle`/`endAngle` are
// radians, CCW from start to end (DXF convention). The `tx` transform
// includes a Y-flip (negative Y scale), so a DXF-CCW arc must be
// authored with sweep-flag 0 in these raw (pre-flip) coordinates -- the
// ambient flip then mirrors it back to the correct CCW appearance on
// screen. Verified against a hand-computed 90-degree case in this file's
// test; a full visual check (open a generated SVG in a browser) is the
// remaining manual verification step noted in Task 3 Step 6 below.
function arcPathD(cx, cy, r, startAngle, endAngle, tx) {
  const start = tx(cx + r * Math.cos(startAngle), cy + r * Math.sin(startAngle));
  const end = tx(cx + r * Math.cos(endAngle), cy + r * Math.sin(endAngle));
  let sweep = endAngle - startAngle;
  while (sweep <= 0) sweep += 2 * Math.PI;
  const largeArcFlag = sweep > Math.PI ? 1 : 0;
  const sweepFlag = 0; // see comment above
  const rx = fmt(r * Math.hypot(tx(1, 0).x - tx(0, 0).x, tx(1, 0).y - tx(0, 0).y));
  return { start, end, d: `M${fmt(start.x)} ${fmt(start.y)} A${rx} ${rx} 0 ${largeArcFlag} ${sweepFlag} ${fmt(end.x)} ${fmt(end.y)}` };
}

function arcToSvg(e, tx) {
  const { d } = arcPathD(e.center.x, e.center.y, e.radius, e.startAngle, e.endAngle, tx);
  return `<path d="${d}"/>`;
}

// LWPOLYLINE vertices connect in sequence, wrapping if `shape` (closed
// polyline). A non-zero `bulge` on a vertex means the segment to the
// NEXT vertex is an arc, not a straight line -- standard DXF bulge
// formula: bulge = tan(includedAngle / 4).
function lwpolylineToSvg(e, tx) {
  const verts = e.vertices;
  const parts = [];
  const n = e.shape ? verts.length : verts.length - 1;
  for (let i = 0; i < n; i++) {
    const a = verts[i];
    const b = verts[(i + 1) % verts.length];
    const bulge = a.bulge || 0;
    if (bulge === 0) {
      const p1 = tx(a.x, a.y);
      const p2 = tx(b.x, b.y);
      parts.push(`M${fmt(p1.x)} ${fmt(p1.y)} L${fmt(p2.x)} ${fmt(p2.y)}`);
    } else {
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const includedAngle = 4 * Math.atan(bulge);
      const radius = dist * (1 + bulge * bulge) / (4 * Math.abs(bulge));
      const midX = (a.x + b.x) / 2, midY = (a.y + b.y) / 2;
      const chordAngle = Math.atan2(dy, dx);
      const sagitta = radius - Math.sqrt(Math.max(radius * radius - (dist / 2) * (dist / 2), 0));
      const sign = bulge > 0 ? 1 : -1;
      const cx = midX - sign * sagitta * Math.sin(chordAngle) * -1;
      const cy = midY + sign * sagitta * Math.cos(chordAngle) * -1;
      const startAngle = Math.atan2(a.y - cy, a.x - cx);
      let endAngle = startAngle + (bulge > 0 ? Math.abs(includedAngle) : -Math.abs(includedAngle));
      const { d } = arcPathD(cx, cy, radius, bulge > 0 ? startAngle : endAngle, bulge > 0 ? endAngle : startAngle, tx);
      parts.push(d);
    }
  }
  return `<path d="${parts.join(' ')}"/>`;
}

/**
 * @param {string} dxfText
 * @param {{ size?: number, padding?: number }} [opts]
 * @returns {{ svg: string, warnings: string[] } | null}
 */
export function dxfTextToSvg(dxfText, opts = {}) {
  const size = opts.size ?? 64;
  const padding = opts.padding ?? 4;

  const parser = new DxfParser();
  const dxf = parser.parseSync(dxfText);
  const allEntities = (dxf && dxf.entities) || [];
  if (allEntities.length === 0) return null;

  const warnings = [];
  const skippedTypes = new Set();
  const entities = allEntities.filter((e) => {
    if (SUPPORTED_TYPES.has(e.type)) return true;
    skippedTypes.add(e.type);
    return false;
  });
  for (const t of skippedTypes) warnings.push(`Skipped unsupported entity type: ${t}`);
  if (entities.length === 0) return null;

  const bounds = computeBounds(entities);
  const tx = fitTransform(bounds, size, padding);
  const scaleFor = (a, b) => Math.hypot(tx(b, 0).x - tx(a, 0).x, 0) / Math.abs(b - a || 1);
  const scale = scaleFor(0, 1);

  const parts = entities.map((e) => {
    if (e.type === 'LINE') return lineToSvg(e, tx);
    if (e.type === 'CIRCLE') return circleToSvg(e, tx, scale);
    if (e.type === 'ARC') return arcToSvg(e, tx);
    if (e.type === 'LWPOLYLINE') return lwpolylineToSvg(e, tx);
    return '';
  });

  const svg = `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">` +
    `<g fill="none" stroke="currentColor" stroke-width="1.5">${parts.join('')}</g></svg>`;

  return { svg, warnings };
}
