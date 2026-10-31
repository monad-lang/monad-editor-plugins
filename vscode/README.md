# Monad for VS Code

> [!WARNING]
> **Experimental pre-release (alpha).** This extension and the Monad
> language it supports are both alpha software. Syntax, APIs, and
> toolchain behavior may change without notice between nightly
> toolchains; the extension is published with the VS Code preview flag
> and follows monad nightlies on a best-effort basis. Do not rely on it
> for production work yet.

VS Code support for the [Monad language](https://monad-lang.org):
syntax highlighting, snippets, the `monad lsp` language server, and
monadup toolchain management.

## Requirements

A Monad toolchain — normally installed with
[monadup](https://monad-lang.org):

```bash
curl -fsSL https://monad-lang.org/install | bash
export PATH=$PATH:~/.monad/bin
monadup default
```

Without one, the extension still highlights and snippets `.mo` files; the
language-intelligence and toolchain commands prompt with install guidance.

## Features

- **Syntax highlighting** for `.mo`/`.monad` — a TextMate grammar mirroring
  [tree-sitter-monad](https://tangled.org/monad-lang.org/tree-sitter-monad)'s
  capture set (the mapping rule lives in the repo's
  `docs/language-server.md`).
- **Language server** — hover, go-to-definition, document/workspace
  symbols, diagnostics; launched from the resolved `monad` binary
  (`monad lsp`).
- **Toolchain management** — status bar item with the active nightly:
  - `Monad: Select Toolchain` — `monadup use`
  - `Monad: Install Latest Toolchain` — `monadup default`
  - `Monad: Update Toolchain` — `monadup update`
  - `Monad: Toolchain Health` — `monadup doctor`
  - `Monad: Toolchain Environment` — `monadup env`
- **File commands** — `Monad: Run Active File` (`monad run`) and
  `Monad: Check Active File` (`monad check`), with the resolved binary.
- **Snippets** for the declaration forms (`def`, `type`, `struct`,
  `class`, `instance`, `match`, `do`, `#[test]`, ...).

## Settings

| Setting | Default | Effect |
|---------|---------|--------|
| `monad.monadPath` | — | Absolute path to the `monad` binary; skips monadup discovery. |
| `monad.monadupPath` | — | Absolute path to `monadup`; defaults to `$MONAD_HOME/bin/monadup`, then PATH. |
| `monad.server.trace` | `off` | LSP trace level in the Monad output channel. |

Binary resolution order and the monadup output formats the extension
parses are documented in the repo's `docs/toolchain.md`.

## Development

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test         # parser golden tests (node --test)
pnpm build        # esbuild bundle to dist/
pnpm package      # VSIX
```

Press F5 in VS Code to launch an Extension Development Host with this
extension loaded; open `../sample/tour.mo` to smoke-test everything.

## Changelog

See `CHANGELOG.md` in this package.
