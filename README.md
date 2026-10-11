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

- **Weekly:** Renovate opens and updates its pull requests before 06:00 UTC on Mondays.
- **Minor and patch updates** for all dependencies come in **one** pull request a week.
- **Major updates** get their own pull request each, because they can break things and need their own review.
- **Security fixes right away:** Renovate checks dependencies against the [OSV](https://osv.dev/) vulnerability database. A fix for a known vulnerability gets its own pull request at once, outside the weekly schedule and the groups. OSV covers package ecosystems such as Go modules and npm, not GitHub Actions or Docker images.
- **Indirect Go modules** (`// indirect` in `go.mod`) are updated too, in one weekly pull request of their own and without major updates. Renovate skips them by default, so a fix in a module like `golang.org/x/net` would otherwise wait until a direct dependency pulled it in.
- **`go mod tidy`** runs after each Go update. A repository that sets its own `postUpdateOptions` replaces the preset's, so it must list `gomodTidy` too.
- **Versions pinned in workflows and composite actions** are updated when they're marked with a comment on the line above. Without the comment, Renovate doesn't see them.

  ```yaml
  env:
    # renovate: datasource=npm depName=@stoplight/prism-cli
    PRISM_VERSION: 5.15.11
  ```

  It applies to `.github/workflows/*.yml` and `action.yml` files. `datasource` is one of Renovate's [datasources](https://docs.renovatebot.com/modules/datasource/), such as `npm`, `github-releases` or `docker`.
- Everything else is Renovate's [`config:recommended`](https://docs.renovatebot.com/presets-config/#configrecommended), including the Dependency Dashboard issue that lists all pending updates.

Each repository's CI runs on Renovate's pull requests like on any other, so a breaking update shows up before it's merged.

## Requirements

The Renovate GitHub app must be installed for this repository and the repositories that use it. It's installed for the whole `Update-Prompt` organization.
