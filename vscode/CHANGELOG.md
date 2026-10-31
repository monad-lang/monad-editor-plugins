# Changelog

## 0.2.0 (2026-10-31)

Synced with tree-sitter-monad v0.2.0 (grammar commit `740bc6e1`):

- TextMate: `::` module-path delimiter (punctuation), aligned with the
  `use`/`open` paths (`use std::io { ... }`).
- TextMate: raw strings `r"…"`, `r#"…"#`, `r##"…"##`, `r###"…"###`.
- TextMate: `#Class` explicit instance hints highlight as types
  (`show #ShowB x`).
- TextMate: dropped the plain `=` operator and the backtick call form —
  neither exists in the v0.2.0 grammar.

## 0.1.0 (2026-10-31)

Experimental pre-release (alpha): the extension ships with the
Marketplace preview flag and tracks Monad's nightly toolchains; syntax
and behavior may change without notice.

- `monad` language: `.mo`/`.monad` extensions, language configuration
  (brackets, comments, folding), TextMate grammar mirroring
  tree-sitter-monad's capture set.
- Snippets for the declaration forms.
- `monad lsp` language client with monadup-aware binary discovery
  (setting → `~/.monad/bin/monad` → PATH) and restart on toolchain
  switch or configuration change.
- Toolchain commands and status bar item: select (`monadup use`),
  install latest (`monadup default`), update (`monadup update`),
  health (`monadup doctor`), environment (`monadup env`).
- `monad run` / `monad check` for the active file.
- Graceful missing-toolchain UX: install guidance, never a broken editor.
