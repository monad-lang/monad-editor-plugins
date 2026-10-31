# monad-plugins: Developer Guide

Editor integrations for the Monad language. Two deliverables — a VS Code
extension (`vscode/`) and a Zed extension (`zed/`) — plus the shared
contract docs they both implement (`docs/`).

**This repo is self-contained.** It must not reference sibling checkouts
(`../monad`, `../tree-sitter-monad`, ...) by path — neither in code, docs,
nor build scripts. Everything external is a published artifact: git URLs
(`https://tangled.org/monad-lang.org/...`), npm/crates dependencies, or the
installed toolchain resolved at run time. The sibling repos are for reading
while developing, never for reaching.

## Layout

```
monad-plugins/
├── docs/                 Contracts + runbooks. The source of truth for
│                         what the extensions may assume.
├── sample/tour.mo        Syntax tour; CI type-checks it with the nightly.
├── vscode/               VS Code extension (TypeScript, esbuild, VSIX)
└── zed/                  Zed extension (Rust, zed_extension_api)
```

## Contracts

The extensions build on three external surfaces, each documented in
`docs/` and version-checked where cheap:

1. **tree-sitter-monad** — the syntax definition. Zed pins a published git
   commit (`zed/extension.toml`); VS Code's TextMate grammar mirrors its
   capture names (`docs/language-server.md` has the sync rule).
2. **monad lsp** — the language server inside the compiler. Capabilities are
   negotiated in the handshake; see `docs/language-server.md`.
3. **monadup** — the toolchain manager. Discovery order, commands, and
   parsed output formats: `docs/toolchain.md`. Output formats are contracts;
   a change upstream means updating the parser in `vscode/src/toolchain.ts`
   and the doc in the same commit.

## Build and check

Prerequisites: node >= 20, pnpm (pinned via `packageManager` in
`vscode/package.json`), a Rust toolchain, and a working Monad nightly
(`monadup default`) for the sample check.

```bash
# Everything (CI does exactly this):
(cd vscode && pnpm install --frozen-lockfile && pnpm typecheck && pnpm test && pnpm build)
(cd zed && cargo check)
monad check sample/tour.mo
```

`devenv shell` provides node, pnpm and rustup if you use devenv.

Rules:

- VS Code extension code is TypeScript with `tsc --noEmit` as the typecheck
  gate; esbuild bundles for packaging. No test framework — use
  `node --test` on plain modules (see `vscode/test/`).
- Zed extension code cannot be tested headless beyond `cargo check`;
  interactive verification steps live in `zed/README.md`.
- `sample/tour.mo` must stay green under `monad check` — it is the
  smoke-test corpus for every feature the extensions claim.

## Committing

- Message format: `scope: msg` (e.g. `vscode: add toolchain picker`,
  `zed: pin grammar 665697bd`, `docs: record monadup env contract`).
- Small, focused commits; one logical change each.
- Anything that changes a documented contract (monadup output, LSP
  capabilities) updates the doc and the code in the same commit.

## Where work is tracked

The master plan is `docs/plan.md`. Missing features in the *toolchain*
(belonging to the monad or monadup repos) are filed as plans in the
monad-plans repo — never implemented here. The current ones:

- `implementations/monadup-json-output.md` — machine-readable monadup
  output (`list`/`env`/version JSON)
- `implementations/monad-toolchain-pinning.md` — project-local toolchain pin
- `implementations/lsp-editor-features.md` — extending `monad lsp`
  (completion, references, rename, formatting, incremental sync)
