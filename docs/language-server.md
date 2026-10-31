# The `monad lsp` contract

`monad lsp` is the language server, shipped inside the compiler binary and
written in Monad (`motes/lsp` in the monad repo). The editor extensions in
this repo are its clients; this document records what they may rely on, and
the sync rule that keeps the VS Code TextMate grammar honest against
tree-sitter-monad.

Verified against serverInfo `monad-lsp` 0.1.0 by a live handshake. When the
server grows (see the monad-plans `implementations/lsp-editor-features`
plan), update this page and the clients in the same commit.

## Launch and transport

```text
monad lsp        # stdin/stdout, Content-Length framed JSON-RPC
```

- **stdio only.** stdout carries protocol frames exclusively; the server
  logs to stderr. Never wrap the binary in anything that echoes to stdout.
- The server exits cleanly on stdin EOF; `exit` without a prior `shutdown`
  exits 1. Clients should still do the shutdown handshake.
- No CLI flags, no config files, no environment requirements beyond the
  toolchain itself.

## Handshake

The `initialize` result advertises exactly:

```json
{
  "capabilities": {
    "positionEncoding": "utf-16",
    "textDocumentSync": 1,
    "hoverProvider": true,
    "definitionProvider": true,
    "documentSymbolProvider": true,
    "workspaceSymbolProvider": true
  },
  "serverInfo": { "name": "monad-lsp", "version": "0.1.0" }
}
```

Consequences for clients:

- **Position encoding**: the server negotiates utf-16 or utf-8 and defaults
  to utf-16 — which is what VS Code speaks natively, so the VS Code client
  needs no encoding middleware. Never assume byte offsets.
- **Full-text sync** (`TextDocumentSyncKind.Full` = 1). The client must send
  whole documents on open/change; incremental sync is not advertised.
- **Workspace root**: the server reads `rootUri` (percent-decoded) or the
  first `workspaceFolders` entry and scans it for `workspace/symbol`. Send a
  real `file:` URI.
- Unknown methods get proper JSON-RPC errors (not silence, not crashes), so
  clients may probe — but prefer gating on capabilities instead.

## What works today

| Feature | Notes |
|---------|-------|
| Diagnostics | pushed on `didOpen`/`didChange`/`didClose`; parse and type errors; cleared when the file leaves the store |
| Hover | declaration detail: `def` (rendered signature), `type` via `show_inductive`, `class` via `show_class` |
| Definition | top-level declarations, in-file and via the workspace scan |
| Document symbols | declarations of every kind the picker knows: def/type/struct/class/instance/infix |
| Workspace symbols | workspace-wide declaration search |

## Known gaps (do not work around silently)

These are pinned as deliberate test assertions in the monad repo's LSP
fixtures (`fixtures/lsp/README.md`); they will be fixed server-side, and
editors must not paper over them:

- Locals are not resolved: a use of a local that shadows a top-level def
  resolves to the top-level def (hover and definition alike).
- Hover on a `struct` shows the bare name (no field list).
- Unnamed instances list as `_` in the symbol picker.
- `def` ranges are whole lines; `struct`/`type`/`class`/`instance` ranges
  run to one past the closing brace.

Not yet implemented at all — treat as future capability, gate on the
handshake: completion, references, rename, formatting, code actions,
incremental sync, `didChangeConfiguration`, `didChangeWatchedFiles`.
The priority order for editors is tracked in the monad-plans
`implementations/lsp-editor-features` plan.

## Editor-side convention

- Diagnostics are the server's job; editors add no linters of their own.
- When the server is missing (no toolchain), the editor shows install
  guidance (see [toolchain.md](toolchain.md)) and stays otherwise functional:
  highlighting, snippets, brackets and file tasks do not depend on the LSP.

## TextMate ↔ tree-sitter sync rule (VS Code)

VS Code has no native tree-sitter highlighting, so `vscode/syntaxes/monad.tmLanguage.json`
mirrors `tree-sitter-monad`'s `queries/highlights.scm` capture set. The
rule, applied on every grammar change upstream:

1. Every literal in `tree-sitter-monad`'s keyword/operator/literal lists has
   a TextMate rule; the TextMate scope maps through the standard theme
   pipeline to the same visual class (`@keyword` → `keyword.*`, `@type` →
   `entity.name.type`, `@function` → `entity.name.function`, etc.).
2. Field-scoped captures (def names, struct fields, params) are approximated
   contextually in TextMate and may drift — the approximation is reviewed,
   not exact.
3. Builtin type names (`Type`, `Pred`, `Sort`) and booleans track the
   `@type.builtin` / `@boolean` rules in the scm.

A CI check that automates rule 1 by parsing the grammar's JavaScript token
lists is a Phase 3 item in [plan.md](plan.md).
