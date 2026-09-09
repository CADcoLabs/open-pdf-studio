// Copyright (c) 2026 Barry Adams / CADcoLabs. All rights reserved.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPI_PROFILE_CATEGORIES } from '../../symbols/data/mapiProfiles.js';

test('MAPI profile categories are non-empty and well-formed', () => {
  assert.ok(MAPI_PROFILE_CATEGORIES.length > 0);
  for (const cat of MAPI_PROFILE_CATEGORIES) {
    assert.ok(cat.id.startsWith('mapi-profile-'));
    assert.ok(cat.name.startsWith('MAPI — '));
    assert.ok(cat.symbols.length > 0);
    for (const sym of cat.symbols) {
      assert.match(sym.svg, /^<svg viewBox="0 0 64 64"/);
    }
  }
});
