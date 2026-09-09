// Copyright (c) 2026 Barry Adams / CADcoLabs. All rights reserved.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NEN1414_CATEGORIES } from './nen1414Library.js';

test('category names are MAPI-branded, not NEN/Dutch', () => {
  for (const cat of NEN1414_CATEGORIES) {
    assert.ok(cat.name.startsWith('MAPI'), `category "${cat.name}" should start with "MAPI"`);
    assert.ok(!/NEN|NL /.test(cat.name), `category "${cat.name}" still mentions NEN/NL`);
  }
});

test('every symbol has an English name, not the original Dutch', () => {
  // Spot-check a handful of ids whose Dutch source text is well known —
  // if translation regresses, these are unambiguous failures.
  const byId = {};
  for (const cat of NEN1414_CATEGORIES) {
    for (const sym of cat.symbols) byId[sym.id] = sym.name;
  }
  assert.equal(byId['nen1414-Tb1.003'], 'Smoke Detector');
  assert.equal(byId['nen1414-Td01'], 'Single Door');
  assert.equal(byId['nen1414-Tw10'], 'Fire Hydrant (Underground)');
  assert.equal(byId['nen1414-Tn11'], 'Generator');
});

test('id fields are untouched (IFC classification depends on them)', () => {
  const ids = NEN1414_CATEGORIES.map(c => c.id).sort();
  assert.deepEqual(ids, [
    'nen1414-tb', 'nen1414-tbk', 'nen1414-td', 'nen1414-tn',
    'nen1414-tr', 'nen1414-tv', 'nen1414-tw',
  ]);
});
