// Copyright (c) 2026 Barry Adams / CADcoLabs. All rights reserved.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dxfTextToSvg } from './dxf-to-svg.mjs';

// Minimal hand-written DXF fixtures. Group codes: 0=entity type, 8=layer,
// 10/20=first point or center x/y, 11/21=second point x/y, 40=radius,
// 50/51=start/end angle in DEGREES (DXF spec) -- dxf-parser converts
// these to radians when it parses the file.

const L_ANGLE_DXF = `0
SECTION
2
ENTITIES
0
LINE
8
0
10
0.0
20
0.0
11
1.5
21
0.0
0
LINE
8
0
10
1.5
20
0.0
11
1.5
21
0.125
0
LINE
8
0
10
1.5
20
0.125
11
0.125
21
0.125
0
LINE
8
0
10
0.125
20
0.125
11
0.125
21
1.5
0
LINE
8
0
10
0.125
20
1.5
11
0.0
21
1.5
0
LINE
8
0
10
0.0
20
1.5
11
0.0
21
0.0
0
ENDSEC
0
EOF
`;

const CIRCLE_DXF = `0
SECTION
2
ENTITIES
0
CIRCLE
8
0
10
0.0
20
0.0
40
5.0
0
ENDSEC
0
EOF
`;

const QUARTER_ARC_DXF = `0
SECTION
2
ENTITIES
0
ARC
8
0
10
0.0
20
0.0
40
10.0
50
0.0
51
90.0
0
ENDSEC
0
EOF
`;

const EMPTY_DXF = `0
SECTION
2
ENTITIES
0
ENDSEC
0
EOF
`;

test('converts a simple L-angle (6 LINE segments) to an SVG with no warnings', () => {
  const result = dxfTextToSvg(L_ANGLE_DXF);
  assert.ok(result, 'expected a non-null result');
  assert.equal(result.warnings.length, 0);
  assert.match(result.svg, /^<svg viewBox="0 0 64 64" xmlns="http:\/\/www\.w3\.org\/2000\/svg">/);
  assert.match(result.svg, /<\/svg>$/);
  // No scripts, no external refs -- must pass the app's existing safety check shape.
  assert.doesNotMatch(result.svg, /<script/i);
  assert.doesNotMatch(result.svg, /href\s*=\s*"https?:/i);
  assert.doesNotMatch(result.svg, /<image|<foreignObject/i);
  // Six line segments in, six path/line commands out.
  const segments = result.svg.match(/<(line|path)/g) || [];
  assert.equal(segments.length, 6);
});

test('converts a CIRCLE and centers it in the viewBox', () => {
  const result = dxfTextToSvg(CIRCLE_DXF);
  assert.ok(result);
  assert.match(result.svg, /<circle/);
  // A single circle with padding=4 on a 64x64 box should be centered at (32,32).
  const m = /<circle[^>]*cx="([\d.]+)"[^>]*cy="([\d.]+)"/.exec(result.svg);
  assert.ok(m, 'expected a circle element with cx/cy');
  assert.ok(Math.abs(Number(m[1]) - 32) < 0.01, `cx should be ~32, got ${m[1]}`);
  assert.ok(Math.abs(Number(m[2]) - 32) < 0.01, `cy should be ~32, got ${m[2]}`);
});

test('converts a 90-degree ARC to a single SVG arc path command', () => {
  const result = dxfTextToSvg(QUARTER_ARC_DXF);
  assert.ok(result);
  const m = /<path d="M[\d.\-]+ [\d.\-]+ A([\d.\-]+) ([\d.\-]+) 0 (\d) (\d) [\d.\-]+ [\d.\-]+"/.exec(result.svg);
  assert.ok(m, `expected one arc path command, got: ${result.svg}`);
  const [, rx, ry, largeArcFlag] = m;
  assert.ok(Math.abs(Number(rx) - Number(ry)) < 0.01, 'rx and ry should match for a circular arc');
  assert.equal(largeArcFlag, '0', 'a 90-degree arc is never the large arc');
});

test('returns null for a DXF with no entities', () => {
  assert.equal(dxfTextToSvg(EMPTY_DXF), null);
});

test('reports unsupported entity types as warnings instead of failing', () => {
  const textEntityDxf = `0
SECTION
2
ENTITIES
0
TEXT
8
0
10
0.0
20
0.0
40
1.0
1
hello
0
LINE
8
0
10
0.0
20
0.0
11
1.0
21
0.0
0
ENDSEC
0
EOF
`;
  const result = dxfTextToSvg(textEntityDxf);
  assert.ok(result);
  assert.deepEqual(result.warnings, ['Skipped unsupported entity type: TEXT']);
  assert.match(result.svg, /<line|<path/);
});
