// Checks what Renovate runs after a Go update, so a Go update PR builds without hand edits.
// Run with: node --test tests/*.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const preset = JSON.parse(readFileSync(new URL('../default.json', import.meta.url), 'utf8'));

test('tidies go.mod and moves imports to the new major version after a Go update', () => {
  // Without gomodUpdateImportPaths, the code still imports the old major version, so the
  // update leaves go.mod half done or go mod tidy puts the old version back.
  assert.ok(preset.postUpdateOptions.includes('gomodTidy'));
  assert.ok(preset.postUpdateOptions.includes('gomodUpdateImportPaths'));
});
