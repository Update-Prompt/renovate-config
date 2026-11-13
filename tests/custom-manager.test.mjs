// Runs the custom regex manager in default.json on lines like the ones in our workflows
// and actions, so a broken pattern fails here instead of silently stopping tool updates.
// Run with: node --test tests/*.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const preset = JSON.parse(readFileSync(new URL('../default.json', import.meta.url), 'utf8'));
const [manager] = preset.customManagers;

// Renovate writes a pattern as /.../ and the match strings as plain regexes
const filePatterns = manager.managerFilePatterns.map((pattern) => new RegExp(pattern.slice(1, -1)));
const matchStrings = manager.matchStrings.map((pattern) => new RegExp(pattern, 'g'));

function dependencies(content) {
  return matchStrings.flatMap((pattern) =>
    [...content.matchAll(pattern)].map(({ groups }) => ({ ...groups }))
  );
}

test('finds the files that pin tools', () => {
  for (const path of ['go-lint/action.yml', 'openapi-validate/action.yaml', '.github/workflows/ci.yml']) {
    assert.ok(filePatterns.some((pattern) => pattern.test(path)), `Expected ${path} to be read`);
  }
  for (const path of ['go-lint/golangci.yml', 'docs/workflows/ci.yml', 'my-action.yml']) {
    assert.ok(!filePatterns.some((pattern) => pattern.test(path)), `Expected ${path} not to be read`);
  }
});

test('reads each pinned version', () => {
  const cases = [
    {
      content: `    - uses: golangci/golangci-lint-action@ba0d7d2 # v9.3.0
      with:
        # renovate: datasource=github-releases depName=golangci/golangci-lint
        version: v2.14.0
        working-directory: .`,
      expected: { datasource: 'github-releases', depName: 'golangci/golangci-lint', currentValue: 'v2.14.0' },
    },
    {
      content: `        # renovate: datasource=github-releases depName=daveshanley/vacuum
        TOOL_VERSION: v0.30.6`,
      expected: { datasource: 'github-releases', depName: 'daveshanley/vacuum', currentValue: 'v0.30.6' },
    },
    {
      content: `          # renovate: datasource=node-version depName=node
          node-version: 24`,
      expected: { datasource: 'node-version', depName: 'node', currentValue: '24' },
    },
    {
      content: `          # renovate: datasource=npm depName=renovate
          RENOVATE_VERSION: "44.165.0"`,
      expected: { datasource: 'npm', depName: 'renovate', currentValue: '44.165.0' },
    },
    {
      content: `  # renovate: datasource=docker depName=stoplight/prism
  PRISM_VERSION: '5.14.2'`,
      expected: { datasource: 'docker', depName: 'stoplight/prism', currentValue: '5.14.2' },
    },
  ];
  for (const { content, expected } of cases) {
    assert.deepEqual(dependencies(content), [expected]);
  }
});

test('reads nothing without the comment', () => {
  assert.deepEqual(dependencies(`        version: v2.14.0
        TOOL_VERSION: v0.30.6`), []);
});
