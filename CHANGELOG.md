# Changelog

Notable cross-cutting changes to this repository. The per-editor extensions
keep their own changelogs where their platform expects them
(`vscode/CHANGELOG.md`); version bumps of a single extension do not appear
here unless they change the contracts in `docs/`.

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
