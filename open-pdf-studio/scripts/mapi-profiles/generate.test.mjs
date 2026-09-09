// Copyright (c) 2026 Barry Adams / CADcoLabs. All rights reserved.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateCategories } from './generate.mjs';

const FIXTURES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

test('groups converted profiles by source subfolder', () => {
  const { categories, failures } = generateCategories(FIXTURES_DIR);
  const names = categories.map((c) => c.name).sort();
  assert.deepEqual(names, ['MAPI — Angle Alum', 'MAPI — Round Tube 6063-T5']);
});

test('symbol names come from the filename without extension', () => {
  const { categories } = generateCategories(FIXTURES_DIR);
  const angleCat = categories.find((c) => c.name === 'MAPI — Angle Alum');
  const symbolNames = angleCat.symbols.map((s) => s.name).sort();
  assert.deepEqual(symbolNames, ['1 X 1 X .125 ARCH. ANGLE']);
});

test('a broken/unparseable DXF is reported as a failure, not a crash', () => {
  const { failures } = generateCategories(FIXTURES_DIR);
  assert.equal(failures.length, 1);
  assert.match(failures[0].file, /BROKEN\.dxf$/);
});

test('every generated symbol has a stable, unique id', () => {
  const { categories } = generateCategories(FIXTURES_DIR);
  const ids = categories.flatMap((c) => c.symbols.map((s) => s.id));
  assert.equal(new Set(ids).size, ids.length, 'symbol ids must be unique');
  for (const id of ids) assert.match(id, /^mapi-profile-/);
});
