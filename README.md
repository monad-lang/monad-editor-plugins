# monad-plugins

Editor integrations for the [Monad language](https://monad-lang.org):
VS Code and Zed extensions backed by the toolchain users already have —
`tree-sitter-monad` for syntax, `monad lsp` for language intelligence, and
`monadup` for toolchain management.

> [!WARNING]
> Monad is in alpha; its toolchains are nightlies. These extensions follow
> the same rule: every capability is negotiated at runtime, never assumed.

## Editors

| Editor | Status | Where |
|--------|--------|-------|
| VS Code | implemented — see [vscode/README.md](vscode/README.md) | `vscode/` |
| Zed | scaffolded — see [zed/README.md](zed/README.md) | `zed/` |

Neovim and Helix are served by [tree-sitter-monad](https://tangled.org/monad-lang.org/tree-sitter-monad)
directly (its README has the config snippets); this repo's `docs/` records
the shared contracts those setups need.

## What the extensions provide

- **Syntax highlighting** — VS Code ships a TextMate grammar kept in sync
  with tree-sitter-monad's capture set; Zed pins the real tree-sitter
  grammar and its queries.
- **Language intelligence** — hover, go-to-definition, document/workspace
  symbols, and diagnostics, from the compiler's own language server
  (`monad lsp`), launched per-workspace.
- **Toolchain management (VS Code)** — active nightly in the status bar;
  one command to install (`monadup default`), select (`monadup use`), or
  update (`monadup update`) toolchains, plus `monadup doctor` health
  reports — all inside the editor.
- **Snippets and file commands (VS Code)** — declaration snippets, and
  run/check of the active file with the resolved toolchain.

## Quick start (development)

```bash
git clone https://tangled.org/monad-lang.org/monad-plugins
cd monad-plugins

# The toolchain the extensions drive (skip if you already have monad):
#   curl -fsSL https://monad-lang.org/install | bash
#   monadup default

# VS Code extension
cd vscode && npm ci && npm run build    # then: code --folder-readonly .

# Zed extension
cd zed && cargo check                   # then follow zed/README.md to install

# The sample the docs and CI use
monad check sample/tour.mo
```

## Layout

```
├── docs/       The contracts: plan, toolchain (monadup), language server
├── sample/     A syntax-tour .mo file for smoke-testing
├── vscode/     The VS Code extension (TypeScript)
└── zed/        The Zed extension (Rust)
```

## Documentation

- [**plan.md**](docs/plan.md) — architecture, editor matrix, phases
- [**toolchain.md**](docs/toolchain.md) — the monadup contract and discovery
  rules
- [**language-server.md**](docs/language-server.md) — the `monad lsp`
  contract, its current capabilities and known gaps
- [**publishing.md**](docs/publishing.md) — release runbook

Feature requests against the toolchain itself (not this repo) are filed as
plans in the [monad-plans](https://github.com/anderssorby/monad-plans)
repo; see `implementations/monadup-json-output.md`,
`implementations/monad-toolchain-pinning.md` and
`implementations/lsp-editor-features.md` there.

## License

Apache-2.0, like the rest of the Monad ecosystem.
