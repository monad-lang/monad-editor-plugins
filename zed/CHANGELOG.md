# Changelog

## 0.2.0 (2026-10-31)

- Grammar pin bumped to tree-sitter-monad v0.2.0 (commit `740bc6e1`):
  `::`-qualified module paths, raw strings, `#![mote]` file attributes,
  operator table aligned with the reference parser (no plain `=`, no
  backtick calls).
- Re-vendored `queries/highlights.scm` from the same commit — the 0.1.0
  vendored copy already used v0.2.0-only node names (`raw_string`,
  `dict_hint`, `use_path`) against the v0.1.1 pin, which Zed would have
  rejected at load; pin and queries are now consistent.
- `queries/folds.scm` unchanged upstream; attribution header updated.
- `queries/indents.scm` node names verified against the v0.2.0
  node-types (all still exist).

## 0.1.0 (2026-10-31)

- Initial release: grammar pinned to tree-sitter-monad v0.1.1
  (`665697bd`), vendored highlights/folds, in-repo indents,
  `monad lsp` language server launch.
