# Monad for Zed

Zed support for the [Monad language](https://monad-lang.org):
tree-sitter-monad syntax highlighting and the `monad lsp` language server.

## What this provides

- **Syntax highlighting, folds, indentation** via the pinned
  [tree-sitter-monad](https://tangled.org/monad-lang.org/tree-sitter-monad)
  grammar; queries are vendored in `queries/` (highlights/folds upstream,
  indents in-repo).
- **Language intelligence** — hover, go-to-definition, document/workspace
  symbols, diagnostics — from `monad lsp`, launched with `monad lsp` on the
  PATH of the Zed process.

## Requirements

The extension does not install the toolchain; it uses the `monad` binary
resolved through Zed's PATH:

```bash
curl -fsSL https://monad-lang.org/install | bash
monadup default
```

The monadup installer puts `monad` at `~/.monad/bin` — make sure that
directory is on the PATH Zed sees:

- Linux/Windows: your shell profile PATH is inherited by desktop apps in
  most setups.
- macOS: GUI apps do **not** read `~/.zshrc`. Either launch Zed from a
  terminal, or `launchctl setenv PATH "$HOME/.monad/bin:$PATH"` (and restart
  Zed), or symlink `monad` into a directory already on the GUI PATH.

## Install (local development)

With the Zed CLI:

```bash
zed extension install --dev zed     # from this directory
```

Then open a `.mo` file (e.g. `../sample/tour.mo` from the repo root) and
check the hover/definition/diagnostic behavior. Uninstall with
`zed extension uninstall monad`.

## Checks

```bash
cargo check     # what CI runs
zed extension lint .   # if the zed CLI is available
```

Zed builds the grammar from the git commit pinned in `extension.toml` on
first use — bumps are deliberate, never opportunistic (see
`docs/publishing.md` in the repo root).

## Land in the registry

Once verified in a running Zed, submit to
[zed-industries/extensions](https://github.com/zed-industries/extensions)
per its README (fork the repo, add `zed/` under `extensions/monad/`, PR).
