# Monad Editor Integrations — Plan

This repo (`monad-plugins`) holds the editor integrations for the
[Monad language](https://monad-lang.org): VS Code and Zed extensions that
make editing `.mo` files feel native, backed by the same toolchain users
already install.

Status: **Phase 1 (VS Code) implemented; Phase 2 (Zed) scaffolded.**
See [Phases](#phases) for detail.

## Mission

One place for everything an editor needs to know about Monad, so each editor
adapter is thin:

- **Syntax** — `tree-sitter-monad` is the single source of truth for how
  Monad is tokenized. Editors that embed tree-sitter consume it directly;
  VS Code gets a TextMate grammar kept deliberately in sync with it.
- **Language intelligence** — `monad lsp` (shipped inside the compiler
  binary) provides hover, go-to-definition, document/workspace symbols and
  diagnostics. We launch it; we do not reimplement it.
- **Toolchain management** — `monadup` installs and selects nightlies under
  `~/.monad`. The extensions surface that: status bar, install, select,
  update, and a health report, from inside the editor.

## Non-goals

- No new language analysis in this repo. Editor-specific analysis belongs in
  `monad lsp` (in the `monad` repo); file feature requests as plans in the
  [monad-plans](https://github.com/anderssorby/monad-plans) repo, and extend
  the server there.
- No fork of the tree-sitter grammar. Zed pins the published
  `tree-sitter-monad` git commit; VS Code's TextMate grammar mirrors its
  capture names and is validated against it.
- No bundling of binaries. The extensions discover `monad`/`monadup` the same
  way the CLI docs tell users to install them; they never download compilers
  silently.

## Contracts this repo builds on

| Contract | Version pinned | Notes |
|----------|-----------------|-------|
| `tree-sitter-monad` | git commit `665697bd` (v0.1.1) | scope `source.monad`, file types `.mo`/`.monad`, queries in `queries/` |
| `monad lsp` | serverInfo `monad-lsp` 0.1.0 | full-text sync, utf-16/utf-8 position negotiation; see [docs/language-server.md](language-server.md) |
| `monadup` | 0.1.0 | `install/list/use/default/uninstall/update/self-install/upgrade/doctor/env/new/version`; see [docs/toolchain.md](toolchain.md) |
| `monad` CLI | nightly | `build/run/eval/repl/check/test/pretty/version/lsp` |

Each contract is checked live at activation time where cheap (`monadup env`,
`monad version`), and the extension degrades gracefully — missing binary
means a prompt with install instructions, not a broken editor.

## Editor matrix

| Capability | VS Code | Zed |
|------------|---------|-----|
| Syntax highlighting | TextMate grammar mirroring tree-sitter captures | tree-sitter `highlights.scm` (from `tree-sitter-monad`) |
| Folds / brackets / indents | `language-configuration.json` | tree-sitter queries (folds vendored; indents/brackets in-repo) |
| Snippets | `snippets/monad.json` | — (Zed snippets are user-side) |
| Hover / definition / symbols | `monad lsp` via `vscode-languageclient` | `monad lsp` via extension `language_server_command` |
| Diagnostics | `monad lsp` publishDiagnostics | same |
| Toolchain status bar | active nightly tag + click-to-select | — (PATH-resolved `monad`) |
| Toolchain install/update/doctor | commands driving `monadup` | — (`monadup` CLI) |
| Run/check file | commands + terminal | — (Zed tasks are user-side) |

Other editors (Neovim, Helix) are already served by `tree-sitter-monad`
upstream; this repo's `docs/` records the shared contracts they need
(position encodings, launch commands, monadup discovery) so nothing here is
VS Code- or Zed-specific by accident.

## Architecture

```
┌───────────────┐   discovery: settings → monadup env → ~/.monad/bin → PATH
│   monadup     │◄───────────────┐
└──────┬────────┘                │
       │ ~/.monad/bin/monad      │
       ▼                         │
┌───────────────┐  stdio  ┌──────┴────────┐
│  monad lsp   │◄────────┤ editor adapter │  vscode/  or  zed/
└───────────────┘         └───────────────┘
                                  ▲
┌───────────────────┐             │ syntax: TextMate (VS Code) / tree-sitter (Zed)
│ tree-sitter-monad │─────────────┘
└───────────────────┘
```

- `vscode/` — the VS Code extension. TypeScript, bundled with esbuild,
  packaged as a VSIX. Language client, toolchain manager, TextMate grammar,
  snippets, tasks commands.
- `zed/` — the Zed extension. Rust (`zed_extension_api`), grammar pinned by
  git commit, queries vendored from `tree-sitter-monad`, LSP launched from
  the `monad` on PATH (see `zed/README.md` for why).
- `docs/` — the contracts (toolchain, language server), publishing runbook,
  and this plan.
- `sample/` — a runnable `.mo` file for manual smoke-testing all of the
  above.

## Phases

### Phase 0 — Repo scaffold (done)

- [x] Repo layout, AGENTS.md, LICENSE (Apache-2.0, like the ecosystem),
      devenv, CI.
- [x] Contract docs: [toolchain.md](toolchain.md),
      [language-server.md](language-server.md).
- [x] `sample/tour.mo` — type-checked by CI.

### Phase 1 — VS Code extension (implemented)

- [x] `monad` language: id, aliases, `.mo`/`.monad` extensions,
      language configuration (brackets, comments, folding).
- [x] TextMate grammar mirroring `tree-sitter-monad`'s capture names
      (`docs/language-server.md` records the mapping and the sync rule).
- [x] Snippets for the declaration forms.
- [x] Language client for `monad lsp` with monadup-aware binary discovery
      and restart on toolchain switch.
- [x] Toolchain commands: select, install latest, update, doctor, env;
      status bar item with the active nightly.
- [x] Run/check active file commands.
- [x] Graceful missing-toolchain UX: prompt with the documented install
      command, never a silent failure.
- [ ] Publish to the Marketplace (blocked on publisher account; see
      [publishing.md](publishing.md)).

### Phase 2 — Zed extension (scaffolded)

- [x] `extension.toml` with grammar pinned to the published
      `tree-sitter-monad` commit; languages config.
- [x] Queries vendored: highlights/folds from `tree-sitter-monad`, plus
      in-repo indents and brackets.
- [x] `language_server_command` launching `monad lsp`.
- [ ] Land the extension in the `zed-industries/extensions` registry.
- [ ] Verify against a Zed build (cannot be done headless; manual step,
      tracked in `zed/README.md`).

### Phase 3 — Deepen (open)

- [ ] Semantic token provider for VS Code driven by `tree-sitter-monad`
      WASM (build step in CI, bundled into the VSIX) — replaces the TextMate
      approximation with the real grammar.
- [ ] Tree-sitter sync check in CI: every keyword/operator in the grammar
      is covered by a TextMate rule (today a manual review, see
      `docs/language-server.md`).
- [ ] Adopt new `monad lsp` features as they land (completion, references,
      rename, formatting) — tracked by the
      `implementations/lsp-editor-features` plan in monad-plans.
- [ ] monadup feature adoption: JSON toolchain listing and project-local
      pinning (`implementations/monadup-json-output`,
      `implementations/monad-toolchain-pinning` plans in monad-plans).

## Risks and notes

- **Nightly churn.** The toolchain is nightly-only and alpha; the extension
  must treat every `monad lsp` capability as optional and version-negotiated,
  never assumed.
- **TextMate drift.** The TextMate grammar is an approximation of
  tree-sitter-monad by construction; when the grammar changes upstream, the
  sync rule in `docs/language-server.md` is the checklist.
- **Zed grammar pin.** Zed builds grammars from a pinned git commit; bump it
  deliberately when `tree-sitter-monad` publishes (see
  [publishing.md](publishing.md)).
