# The monadup contract

The extensions drive the [monadup](https://monad-lang.org) toolchain
manager; this document is the contract between them. monadup installs
nightly toolchains under `~/.monad` (override: `MONAD_HOME`), with
`~/.monad/bin/monad` a symlink to the active toolchain's compiler binary.

Everything here was verified against monadup 0.1.0; if monadup's output
changes, update `vscode/src/toolchain.ts` and this page in the same commit.

## Binary discovery

`monad` (the compiler, and the language server's transport) is resolved in
this order — first hit wins:

1. **The `monad.monadPath` setting** (absolute path). Everything else is
   skipped; this is the escape hatch for exotic installs.
2. **monadup's active toolchain**: `$MONAD_HOME/bin/monad`, defaulting to
   `~/.monad/bin/monad`. `monadup use <tag>` re-points this symlink, so the
   resolved path is stable across switches.
3. **`monad` on `PATH`** (a from-source build or distro package).

`monadup` itself is resolved as: the `monad.monadupPath` setting, then
`$MONAD_HOME/bin/monadup`, then `monadup` on `PATH`.

A resolved `monad` is *verified* before use by running `monad version` — a
fast, no-args invocation. Failure falls through to the next candidate
instead of poisoning the language client.

## Commands the extensions use

| Command | Used for | Output |
|---------|----------|--------|
| `monadup env` | status bar (active tag), discovery | text, `key: value` lines |
| `monadup list` | toolchain picker | text, one per line, `* ` marks active |
| `monadup use <tag>` | switching toolchains | — |
| `monadup default` | install latest + activate | — |
| `monadup update` | fetch newest nightly (prunes old ones) | — |
| `monadup uninstall <tag>` | not surfaced in-editor (destructive) | — |
| `monadup doctor [--json]` | health report: binary, symlink, PATH, `llc`/`clang`/`bdw-gc` | JSON with `--json` |
| `monad version` | binary verification | commit hash, e.g. `a4d8fde` |

Install/update run in an **integrated terminal**, not a background process:
they hit the network and stream progress; the user must be able to watch and
interrupt them. Non-network commands (`env`, `list`, `doctor`) run as child
processes and their output is parsed.

## Parsed formats

### `monadup env`

```text
platform:       x86_64-linux   (from uname -sm, Linux x86_64)
home:           /home/user/.monad  (default)
active:         nightly-2026-10-30-a4d8fde7
toolchain root: /home/user/.monad/downloads/nightly-2026-10-30-a4d8fde7 (sources present: 4)
PATH:           /home/user/.monad/bin (present)
compiler:       ../downloads/nightly-2026-10-30-a4d8fde7/monad-nightly-x86_64-linux
tools:          llc=yes, clang=yes, pkg-config=yes, bdw-gc=no
overrides:      (none)
```

Parsing rule: split each line at the first `:`, trim the value. Some values
carry a trailing parenthesized annotation — treat it as part of the value and
do not rely on it. Keys the extension reads: `home`, `active`,
`toolchain root`. `compiler` is a path relative to `~/.monad/bin`; the
extension ignores it in favor of the stable `bin/monad` symlink.

### `monadup list`

```text
  nightly-2026-10-16-36a710fe  36a710f
  nightly-2026-10-17-5c5d79e0  5c5d79e
* nightly-2026-10-30-a4d8fde7  a4d8fde
```

Parsing rule: trim; a line starting `* ` marks the active toolchain; the
first whitespace-separated token is the tag. The extension parses this text
today, which is the one place a monadup output change could break the picker
silently — see the JSON request below.

### `monadup doctor --json`

A single JSON object:

```json
{
  "active": "nightly-2026-10-30-a4d8fde7",
  "home": "/home/user/.monad",
  "platform": "x86_64-linux",
  "toolchain_root": "/home/user/.monad/downloads/nightly-2026-10-30-a4d8fde7",
  "sources": ["init", "std", "llvm", "runtime"],
  "summary": { "ok": 17, "warn": 0, "fail": 1 },
  "checks": [
    { "name": "binary-runs", "status": "ok", "detail": "monad version: a4d8fde", "hint": null },
    { "name": "boehm-gc", "status": "fail", "detail": "boehm-gc not found",
      "hint": "install Boehm GC development files (libgc-dev / gc-devel / bdw-gc)" }
  ]
}
```

The extension surfaces `summary` as a notification and failed checks (with
their `hint`) in the Monad output channel.

## After a switch

`monadup use/default/update` can change the compiler under a running
language server. The VS Code extension therefore restarts `monad lsp`
whenever it drives (or observes the completion of) one of those commands,
and refreshes the status bar. The order matters: switch first, then restart,
so the new server binary is the one that comes up.

## Missing features (reported in monad-plans)

These gaps make editor integration harder than it needs to be. Each is
filed as a plan in the monad-plans repo (`implementations/`):

- **`monadup list --json` / `env --json`** — machine-readable toolchain
  listing and environment, symmetric with `doctor --json`. Today the
  picker parses human text with an `*` marker.
  Plan: `implementations/monadup-json-output.md`.
- **Project-local toolchain pinning** — a rustup-style pin file honored by
  `monadup` and `monad`, so a workspace opens against the nightly it was
  written for instead of the global active one.
  Plan: `implementations/monad-toolchain-pinning.md`.
- **Capability reporting per nightly** — `monad version --json` (and the
  serverInfo version) so an editor can tell *which* `monad lsp` feature set
  a nightly has, and degrade accordingly. Folded into the monadup JSON plan.
