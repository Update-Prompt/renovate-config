// Checks which updates Renovate may merge on its own. Renovate merges an update when the
// last matching package rule that sets automerge says true, so these tests go through the
// rules in order, the way Renovate does, for each kind of update. They check this preset's
// own rules only: security fixes (vulnerabilityAlerts) keep the automerge these rules give.
// Run with: node --test tests/*.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const preset = JSON.parse(readFileSync(new URL('../default.json', import.meta.url), 'utf8'));

const updateTypes = ['major', 'minor', 'patch', 'pin', 'pinDigest', 'digest', 'replacement', 'rollback'];
const managers = ['gomod', 'npm', 'docker-compose', 'dockerfile', 'github-actions', 'custom.regex'];
// For each manager, the dependency types Renovate gives it ('' when it sets none)
const depTypes = {
  gomod: ['require', 'indirect', 'golang', 'toolchain'],
  npm: ['dependencies', 'devDependencies'],
  'docker-compose': [''],
  dockerfile: ['final', 'stage'],
  'github-actions': ['action', 'workflow', 'uses-with', 'docker', 'container', 'service', 'github-runner'],
  'custom.regex': [''],
};
// Every update a CI tool can get, except major and digest updates, which a person merges
const ciUpdateTypes = new Set(['minor', 'patch', 'pin', 'pinDigest']);

function isCiTool(manager, depType) {
  return manager === 'custom.regex' || (manager === 'github-actions' && ['action', 'workflow'].includes(depType));
}

function* allUpdates() {
  for (const manager of managers) {
    for (const depType of depTypes[manager]) {
      for (const updateType of updateTypes) yield { manager, depType, updateType };
    }
  }
}

test('Renovate merges only after its own check of every status, never through GitHub auto-merge', () => {
  // GitHub auto-merge only waits for required checks, and our repositories have none, so it
  // would merge before CI finishes. Renovate's own merge waits until every check has passed.
  assert.equal(preset.platformAutomerge, false);
  assert.notEqual(preset.ignoreTests, true);
});

test('merges patch updates and CI tools, nothing else', () => {
  for (const update of allUpdates()) {
    const { manager, depType, updateType } = update;
    const expected =
      updateType === 'patch' || (isCiTool(manager, depType) && ciUpdateTypes.has(updateType));
    assert.equal(
      resolve(update).automerge === true,
      expected,
      `${JSON.stringify(update)} should ${expected ? '' : 'not '}be merged by Renovate`
    );
  }
});

test('leaves a moved action tag to a person', () => {
  // A digest update of a pinned action means its tag now points to other code
  assert.notEqual(resolve({ manager: 'github-actions', depType: 'action', updateType: 'digest' }).automerge, true);
});

test('leaves Go, Node, runner and container versions in workflows to a person', () => {
  for (const depType of ['uses-with', 'docker', 'container', 'service', 'github-runner']) {
    assert.notEqual(resolve({ manager: 'github-actions', depType, updateType: 'minor' }).automerge, true, depType);
  }
});

test('waits 3 days before merging a release on its own', () => {
  for (const rule of preset.packageRules.filter((rule) => rule.automerge === true)) {
    assert.equal(rule.minimumReleaseAge, '3 days', rule.description);
  }
});

test('keeps updates that are merged on their own apart from those a person merges', () => {
  const groups = new Map();
  for (const update of allUpdates()) {
    const { groupSlug, automerge, enabled } = resolve(update);
    if (enabled === false || !groupSlug) continue;
    groups.set(groupSlug, [...(groups.get(groupSlug) ?? []), automerge === true]);
  }
  for (const [slug, merged] of groups) {
    assert.ok(merged.every((m) => m === merged[0]), `Group ${slug} mixes automerged and manual updates`);
  }
});

// Helpers

function resolve({ manager, depType, updateType }) {
  const result = {};
  for (const rule of preset.packageRules) {
    if (rule.matchManagers && !rule.matchManagers.includes(manager)) continue;
    if (rule.matchDepTypes && !rule.matchDepTypes.includes(depType)) continue;
    if (rule.matchUpdateTypes && !rule.matchUpdateTypes.includes(updateType)) continue;
    for (const [key, value] of Object.entries(rule)) {
      if (!key.startsWith('match') && key !== 'description') result[key] = value;
    }
  }
  return result;
}
