# Contributing

Thanks for your interest in Spotify Deck+! This document explains how the repository is organized.

## Branches

| Branch | Purpose |
| --- | --- |
| `main` | Released code only. Every commit on `main` is a tagged release. |
| `develop` | Integration branch for the next release. Open pull requests against this branch. |
| `feature/<short-name>` | New features, branched from `develop` |
| `fix/<issue>-<short-name>` | Bug fixes, branched from `develop`, for example `fix/12-volume-jump` |
| `hotfix/<version>` | Urgent fixes to a release, branched from `main` and merged back into both `main` and `develop` |

```
main     ●───────────────●──────────●
          \             / \        /
develop    ●──●──●──●──●───●──●──●
               \    /         \  /
feature/x       ●──●           ●
```

## Issues and milestones

- **Open an issue** for every bug or feature before starting work, and use the issue templates.
- **Milestones** match release versions (`v0.1.1`, `v0.2.0`, …). Issues planned for a release are assigned to its milestone.
- **Labels:** `bug`, `enhancement`, `area:*` (dials, keys, auth, i18n), `platform:*`, `marketplace`, and `needs-verification` for code that is implemented but not yet tested on real hardware.
- **Link the issue** from your commit or pull request (`Fixes #12`). The issue closes when the change reaches `main`.

## Releasing

1. Make sure every issue in the milestone is done or moved to a later milestone.
2. Bump the version in `package.json` and `com.protomothis.spotify-deck-plus.sdPlugin/manifest.json` (`x.y.z.0`).
3. Open a pull request from `develop` to `main` titled `Release vX.Y.Z`, then merge it.
4. Tag the merge commit as `vX.Y.Z`, run `npm run pack`, and create a GitHub release with the `.streamDeckPlugin` from `dist/` attached.
5. Close the milestone.

## Development

```bash
npm install
npm run build && npm run link   # first time; then restart the Stream Deck app
npm run watch                   # rebuild and restart the plugin on change
npm run typecheck
npm run validate
```

Plugin logs are in `com.protomothis.spotify-deck-plus.sdPlugin/logs/`.

## Code guidelines

- TypeScript, strict mode. Run `npm run typecheck` before you push.
- **User-facing text** belongs in `src/i18n.ts` (keys, dials and errors), `src/server.ts` (settings page), or the `*.json` locale files (Stream Deck action list). Add every new string in English, Korean and Japanese.
- **Never log tokens or API payloads.** The logger stays at `info` for this reason.
