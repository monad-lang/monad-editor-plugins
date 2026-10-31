# Monad for Zed

> [!WARNING]
> **Experimental pre-release (alpha).** This extension and the Monad
> language it supports are both alpha software. Syntax, APIs, and
> toolchain behavior may change without notice between nightly
> toolchains; the extension follows monad nightlies on a best-effort
> basis. Do not rely on it for production work yet.

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

Installing compiles the extension to WASM, so Zed needs a Rust toolchain
with the `wasm32-wasip2` target on its PATH:

- **rustup toolchains**: nothing to do — if the target is missing, Zed runs
  `rustup target add wasm32-wasip2` itself. Install it up front with
  `rustup target add wasm32-wasip2`.
- **Nix toolchains** (NixOS, this repo): there is no `rustup` to install
  the target, so Zed fails with
  `failed to run 'rustup target add': No such file or directory`. Use
  `devenv shell` from the repo root — `devenv.nix` provides a stable
  toolchain with `wasm32-wasip2` built in — and launch Zed from that
  shell (`zeditor .`). A GUI-launched Zed re-reads PATH from the login
  shell instead and will not see the devenv toolchain.

Then install from the Zed UI: open this repo in Zed, open the Extensions
page (`ctrl-shift-x`), and click **Install Dev Extension**.

Open a `.mo` file (e.g. `../sample/tour.mo` from the repo root) and check
the hover/definition/diagnostic behavior. Uninstall from the same page.

## Checks

```bash
cargo check     # what CI runs
```

Zed builds the grammar from the git commit pinned in `extension.toml` on
first use — bumps are deliberate, never opportunistic (see
`docs/publishing.md` in the repo root).

## Land in the registry

Once verified in a running Zed, submit to
[zed-industries/extensions](https://github.com/zed-industries/extensions)
per its README (fork the repo, add `zed/` under `extensions/monad/`, PR).
