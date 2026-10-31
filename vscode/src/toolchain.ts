// Toolchain discovery and monadup driving. Node-only — no `vscode` import —
// so the resolution and invocation logic stays testable outside the editor.
// The contract this implements is docs/toolchain.md.

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import * as path from "node:path";
import {
  MonadupEnv,
  ToolchainEntry,
  parseMonadupEnv,
  parseMonadupList,
} from "./parsers";

/** The `monad` home: `$MONAD_HOME` or `~/.monad`. */
export function monadHome(): string {
  const fromEnv = process.env["MONAD_HOME"];
  return fromEnv && fromEnv.length > 0 ? fromEnv : path.join(homedir(), ".monad");
}

/** Look `name` up on `PATH` synchronously. Returns the first hit or null. */
export function which(name: string): string | null {
  const dirs = (process.env["PATH"] ?? "").split(path.delimiter);
  for (const dir of dirs) {
    if (dir.length === 0) {
      continue;
    }
    const candidate = path.join(dir, name);
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

export interface ToolchainSettings {
  /** The `monad.monadPath` setting, if set. */
  monadPath?: string;
  /** The `monad.monadupPath` setting, if set. */
  monadupPath?: string;
}

/** Where `monadup` itself was found. */
export function resolveMonadup(settings: ToolchainSettings): string | null {
  if (settings.monadupPath && settings.monadupPath.length > 0) {
    return settings.monadupPath;
  }
  const home = path.join(monadHome(), "bin", "monadup");
  if (existsSync(home)) {
    return home;
  }
  return which("monadup");
}

export interface CapturedRun {
  code: number;
  stdout: string;
  stderr: string;
}

/** Run a command and capture its output. Rejects only on spawn failure. */
export function capture(command: string, args: string[]): Promise<CapturedRun> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => (stdout += chunk.toString("utf8")));
    child.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString("utf8")));
    child.on("error", reject);
    child.on("close", (code) => resolve({ code: code ?? -1, stdout, stderr }));
  });
}

/** The resolved state of the world after discovery. */
export interface Toolchain {
  /** Path to the `monad` binary to use, or null when nothing is installed. */
  monadPath: string | null;
  /** How `monadPath` was found, for status display. */
  source: "setting" | "monadup-home" | "path" | "none";
  /** Path to monadup, or null when it is not installed. */
  monadupPath: string | null;
  /** `monadup env`, when monadup is present and answered. */
  env: MonadupEnv | null;
  /** What `monad version` printed for the resolved binary, when it runs. */
  version: string | null;
}

/**
 * Resolve the toolchain per docs/toolchain.md:
 * setting → monadup home → PATH, verifying the binary with `monad version`.
 */
export async function resolveToolchain(
  settings: ToolchainSettings,
): Promise<Toolchain> {
  const monadupPath = resolveMonadup(settings);

  let env: MonadupEnv | null = null;
  if (monadupPath) {
    try {
      const run = await capture(monadupPath, ["env"]);
      if (run.code === 0 && run.stdout.length > 0) {
        env = parseMonadupEnv(run.stdout);
      }
    } catch {
      // monadup exists but cannot run (broken install, wrong arch): fall
      // through with env = null; discovery below still tries the symlink.
    }
  }

  let monadPath: string | null = null;
  let source: Toolchain["source"] = "none";
  if (settings.monadPath && settings.monadPath.length > 0) {
    monadPath = settings.monadPath;
    source = "setting";
  } else {
    const homeBin = path.join(monadHome(), "bin", "monad");
    if (existsSync(homeBin)) {
      monadPath = homeBin;
      source = "monadup-home";
    } else {
      const onPath = which("monad");
      if (onPath) {
        monadPath = onPath;
        source = "path";
      }
    }
  }

  let version: string | null = null;
  if (monadPath) {
    try {
      const run = await capture(monadPath, ["version"]);
      if (run.code === 0) {
        version = run.stdout.trim();
      }
    } catch {
      // A `monad` that cannot even print its version cannot serve the LSP;
      // report the miss rather than hand the client a dead binary.
      monadPath = null;
      source = "none";
      version = null;
    }
  }

  return { monadPath, source, monadupPath, env, version };
}

/** `monadup list`, parsed; empty when monadup is missing or fails. */
export async function listToolchains(
  monadupPath: string,
): Promise<ToolchainEntry[]> {
  const run = await capture(monadupPath, ["list"]);
  if (run.code !== 0) {
    return [];
  }
  return parseMonadupList(run.stdout);
}
