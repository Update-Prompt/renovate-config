# renovate-config

Shared [Renovate](https://docs.renovatebot.com/) configuration for the Update Prompt repositories. Change it here, and every repository that uses it follows.

## Use it in a repository

Add `renovate.json` to the repository root:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["github>Update-Prompt/renovate-config"]
}
```

Repository-specific settings go next to `extends` in that file.

## What the preset does

[`default.json`](default.json):

- **Weekly:** Renovate opens and updates its pull requests on Mondays (all day, UTC). The hosted app runs only every few hours, so a shorter window can be missed for weeks.
- **Patch updates and CI tools** come in **one** pull request a week that **Renovate merges itself** once every check on it has passed. CI tools are the actions and reusable workflows in `uses:` and the tool versions pinned with a `# renovate:` comment (see below), for every update except major and digest updates: they only run in CI, so CI shows whether they still work. Go, Node, runner and container versions set in workflows are not CI tools here; a person reviews them with the minor updates.
- **Minor updates** for everything else (plus pins and digests outside CI) come in **one** pull request a week that a person merges after review.
- **Major updates** get their own pull request each, merged by a person, because they can break things and need their own review.

| Update | Pull request | Merged by |
|---|---|---|
| Patch | `patch updates and CI tools` | Renovate, when every check passes |
| CI tool: minor, pin | `patch updates and CI tools` | Renovate, when every check passes |
| Minor, pin, digest (incl. a moved action tag) | `minor updates` | A person |
| Major | One per dependency | A person |

- **How Renovate merges:** Renovate merges on its own runs, only when every check on the pull request has finished and passed (a skipped job counts as passed), and never while a check is still running or has failed. It doesn't use GitHub's auto-merge, which waits only for required checks, and our repositories require none because most workflows only start for the files they test. A merge can take a few hours, until Renovate's next run. Jobs that only run on `main` or on a schedule don't run on the pull request, so an action used only there is merged untested.
- **3 days' wait:** a release Renovate merges on its own must be at least 3 days old, so a broken or hijacked release has time to be pulled first. Updates without a release date don't wait. Since Renovate opens pull requests only on Mondays, a release from Friday to Sunday waits until the Monday after, up to 10 days.
- **Security fixes right away:** Renovate checks dependencies against the [OSV](https://osv.dev/) vulnerability database. A fix for a known vulnerability gets its own pull request at once, outside the weekly schedule and the groups. OSV covers package ecosystems such as Go modules and npm, not GitHub Actions or Docker images. A fix that is a patch update or a CI tool update is merged by Renovate once every check passes, without the 3 days' wait; other fixes wait for a person.
- **Indirect Go modules** (`// indirect` in `go.mod`) are updated too, in weekly pull requests of their own and without major updates: one with patch updates that Renovate merges like above, and one with minor updates for a person. Renovate skips them by default, so a fix in a module like `golang.org/x/net` would otherwise wait until a direct dependency pulled it in.
- **`go mod tidy`** runs after each Go update. A repository that sets its own `postUpdateOptions` replaces the preset's, so it must list `gomodTidy` too.
- **Versions pinned in workflows and composite actions** are updated when they're marked with a comment on the line above. Without the comment, Renovate doesn't see them.

  ```yaml
  env:
    # renovate: datasource=npm depName=@stoplight/prism-cli
    PRISM_VERSION: 5.15.11
  ```

  It applies to `.github/workflows/*.yml` and `action.yml` files. `datasource` is one of Renovate's [datasources](https://docs.renovatebot.com/modules/datasource/), such as `npm`, `github-releases` or `docker`.
- **GitHub Actions are pinned by commit SHA**, with the version in a comment: `uses: actions/checkout@<sha> # v7.0.1`. A tag such as `v7` can be moved to other code by whoever controls the action; a SHA can't. Renovate turns tags into SHAs once, then updates the SHA and the comment like any other version, so these updates come in the `patch updates and CI tools` pull request. If a tag is moved to other code, the new SHA comes as a digest update in the `minor updates` pull request, so a person sees it before it's used.
- Everything else is Renovate's [`config:recommended`](https://docs.renovatebot.com/presets-config/#configrecommended), including the Dependency Dashboard issue that lists all pending updates.

Each repository's CI runs on Renovate's pull requests like on any other, so a breaking update shows up before it's merged. A pull request whose CI fails stays open for a person.

## Checks

[`validate.yml`](.github/workflows/validate.yml) runs Renovate's config validator on every JSON file here (`default.json`, `renovate.json` and any new preset) in every pull request that changes them or the tests. A broken preset doesn't fail anywhere else: Renovate just stops updating every repository that uses it.

It also runs [`tests/automerge.test.mjs`](tests/automerge.test.mjs), which checks that only patch updates and non-major CI tools are merged by Renovate, and [`tests/custom-manager.test.mjs`](tests/custom-manager.test.mjs) (`node --test tests/*.test.mjs`), which runs the `# renovate:` custom manager on sample lines from our workflows and actions. The validator only checks that the pattern compiles, not that it still finds the versions.

## Requirements

The Renovate GitHub app must be installed for this repository and the repositories that use it. It's installed for the whole `Update-Prompt` organization.

Renovate merges as the Renovate app. A rule on `main` that needs an approving review blocks those merges, unless the app may bypass it; the pull request then waits for a person.
