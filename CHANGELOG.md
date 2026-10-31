# Changelog

Notable cross-cutting changes to this repository. The per-editor extensions
keep their own changelogs where their platform expects them
(`vscode/CHANGELOG.md`); version bumps of a single extension do not appear
here unless they change the contracts in `docs/`.

## Unreleased

- pnpm-first: the VS Code extension is developed, built and packaged with
  pnpm (`pnpm-lock.yaml` + `pnpm-workspace.yaml` replace
  `package-lock.json`; CI, devenv and the docs follow). `vsce` runs with
  `--no-dependencies` — esbuild bundles everything and `node_modules`
  never ships in the VSIX.

## 0.2.0 (2026-10-31)

Cross-cutting: tree-sitter-monad contract bumped to v0.2.0 (commit
`740bc6e1`) — grammar pin, vendored Zed queries, TextMate sync (see
`docs/plan.md`'s contract table). The 0.1.0 vendored Zed highlights
already carried v0.2.0-only node names against the v0.1.1 pin; both
extensions are now consistent at v0.2.0. Both extensions version-bumped
to 0.2.0 (`zed/CHANGELOG.md` is new — the publishing runbook referenced
it without the file existing).

## 0.1.0 (2026-10-31)

- Everything in this repo is an **experimental pre-release (alpha)**:
  both extensions ship with preview/experimental markers, because the
  Monad language and its nightly toolchains are not stable yet.
- Repo scaffold: AGENTS.md, contract docs (`docs/`), CI, devenv.
- VS Code extension: `monad` language (TextMate grammar mirroring
  tree-sitter-monad's captures), snippets, `monad lsp` client with
  monadup-aware discovery, toolchain commands (select/install/update/
  doctor/env) with a status bar item, run/check file commands.
- Zed extension scaffold: grammar pinned to tree-sitter-monad `665697bd`,
  vendored highlights/folds + in-repo indents/brackets queries,
  `monad lsp` launch.
- `sample/tour.mo` — a type-checking syntax tour for smoke-testing.
