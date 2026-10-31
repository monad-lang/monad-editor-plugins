# Publishing runbook

Everything published from this repo is an **experimental pre-release
(alpha)** until the Monad language is ready for general use. Keep the
markers in place on every release: VS Code `preview: true` in
`package.json` (Marketplace "Preview" badge), the `EXPERIMENTAL` prefix in
both extensions' manifest descriptions, and the alpha warning banners in
the READMEs. Dropping them is a deliberate repo-wide decision, not a
version bump.

Versioning: the two extensions version independently (their platforms have
independent release cadences), but both use `MAJOR.MINOR.PATCH` starting at
`0.1.0`. Bump:

- `vscode/package.json` `version` + `vscode/CHANGELOG.md`
- `zed/extension.toml` `version` + `zed/CHANGELOG.md`

The repo-level `CHANGELOG.md` records cross-cutting changes.

## VS Code (VSIX)

Prerequisites: node >= 20, an Azure DevOps personal access token for the
`monad-lang` publisher (Marketplace).

```bash
cd vscode
npm ci
npm run typecheck
npm test
npx vsce package          # produces monad-<version>.vsix
# Install locally to smoke-test:
code --install-extension monad-<version>.vsix
# Publish:
npx vsce publish          # needs the publisher PAT once: npx vsce login <publisher>
```

Checklist before publishing:

- [ ] `npx vsce package` is warning-free (missing repository/icon fields
      surface here).
- [ ] Alpha markers intact: `preview: true` in `package.json`, the
      `EXPERIMENTAL` description prefix, README warning banner.
- [ ] Manual smoke test with `sample/tour.mo`: highlighting, hover,
      definition, document symbols, diagnostics on an intentional error,
      status bar toolchain tag, toolchain select.
- [ ] The TextMate ↔ tree-sitter sync rule in
      [language-server.md](language-server.md) has been applied if
      `tree-sitter-monad` changed since the last release.
- [ ] `vscode/CHANGELOG.md` has an entry for the new version.

Marketplace publisher account: pending (Phase 1 leftover). Until it exists,
distribute the VSIX from GitHub/tangled releases.

## Zed

Zed extensions live in `zed/` and ship through the community registry
(`zed-industries/extensions`) as a PR; Zed builds them from source.

```bash
cd zed
cargo check
# Local smoke test: install the dev extension in the running editor
# (Extensions page → Install Dev Extension — see zed/README.md).
```

Checklist before the registry PR:

- [ ] `extension.toml` grammar commit matches the published
      `tree-sitter-monad` HEAD you verified against (bump deliberately, not
      opportunistically — Zed users get whatever is pinned).
- [ ] Alpha markers intact: `EXPERIMENTAL` description prefix in
      `extension.toml`, README warning banner.
- [ ] Queries in `zed/queries/` still match the pinned grammar's node names
      (rename an upstream rule and every scm referencing it breaks at load).
- [ ] Local install smoke test: highlighting, brackets, folds, hover,
      definition, diagnostics with `sample/tour.mo`.
- [ ] `monad` is on PATH for the Zed process (macOS GUI apps do not inherit
      shell PATH — users need `~/.monad/bin` in PATH via `launchctl setenv` or
      the Zed setting; `zed/README.md` documents this).

## tree-sitter-monad bumps

When `tree-sitter-monad` publishes:

1. Update the pinned commit in `zed/extension.toml`.
2. Re-apply the sync rule from [language-server.md](language-server.md) to
   `vscode/syntaxes/monad.tmLanguage.json`.
3. Re-vendor `queries/highlights.scm` + `queries/folds.scm` into `zed/queries/`
   (keep the attribution headers).
4. Run both extensions' checks, bump versions, changelogs, publish.
