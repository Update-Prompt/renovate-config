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

Repository-specific settings, such as a custom manager, go next to `extends` in that file.

## What the preset does

[`default.json`](default.json):

- **Weekly:** Renovate opens and updates its pull requests before 06:00 UTC on Mondays.
- **Minor and patch updates** for all dependencies come in **one** pull request a week.
- **Major updates** get their own pull request each, because they can break things and need their own review.
- Everything else is Renovate's [`config:recommended`](https://docs.renovatebot.com/presets-config/#configrecommended), including the Dependency Dashboard issue that lists all pending updates.

Each repository's CI runs on Renovate's pull requests like on any other, so a breaking update shows up before it's merged.

## Requirements

The Renovate GitHub app must be installed for this repository and the repositories that use it. It's installed for the whole `Update-Prompt` organization.
