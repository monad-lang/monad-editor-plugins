// Pure parsers for monadup's text output. No imports — these are the parts
// of the toolchain contract (docs/toolchain.md) that get exercised by unit
// tests with golden output captured from the real monadup.

/** `monadup env` — the resolved environment, as `key: value` lines. */
export interface MonadupEnv {
  platform?: string;
  home?: string;
  active?: string;
  toolchainRoot?: string;
  /** Every key monadup printed, with values verbatim (minus padding). */
  raw: Record<string, string>;
}

/** One installed nightly, as `monadup list` prints it. */
export interface ToolchainEntry {
  /** The full tag, e.g. `nightly-2026-10-30-a4d8fde7`. */
  tag: string;
  /** Whether `monadup list` marked it active (`* ` prefix). */
  active: boolean;
}

/** The interesting subset of `monadup doctor --json`. */
export interface DoctorCheck {
  name: string;
  status: string;
  detail: string | null;
  hint: string | null;
}

export interface DoctorReport {
  active: string | null;
  home: string | null;
  platform: string | null;
  summary: { ok: number; warn: number; fail: number };
  checks: DoctorCheck[];
}

// monadup writes `key:  value` with padded values, and some values carry a
// trailing parenthesized annotation (`/home/user/.monad  (default)`).
// Everything after the last space-paren at the very end of a VALUE is an
// annotation; the keys the extension reads never contain one themselves.

function stripAnnotation(value: string): string {
  const match = value.match(/^(.*?)\s+\([^)]*\)$/);
  return match ? match[1] : value;
}

/** Parse `monadup env` output. Unknown keys are kept in `raw`. */
export function parseMonadupEnv(text: string): MonadupEnv {
  const raw: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const colon = line.indexOf(":");
    if (colon <= 0) {
      continue;
    }
    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    if (key.length === 0) {
      continue;
    }
    raw[key] = value;
  }
  return {
    platform: raw["platform"] ? stripAnnotation(raw["platform"]) : undefined,
    home: raw["home"] ? stripAnnotation(raw["home"]) : undefined,
    active: raw["active"] ? stripAnnotation(raw["active"]) : undefined,
    toolchainRoot: raw["toolchain root"]
      ? stripAnnotation(raw["toolchain root"])
      : undefined,
    raw,
  };
}

/** Parse `monadup list` output: one toolchain per line, `* ` marks active. */
export function parseMonadupList(text: string): ToolchainEntry[] {
  const entries: ToolchainEntry[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      continue;
    }
    const active = trimmed.startsWith("* ");
    const body = active ? trimmed.slice(2).trim() : trimmed;
    const tag = body.split(/\s+/)[0];
    if (tag.length === 0) {
      continue;
    }
    entries.push({ tag, active });
  }
  return entries;
}

/**
 * Parse `monadup doctor --json`. Throws only on invalid JSON or a shape so
 * wrong nothing can be shown; unknown check names pass through verbatim.
 */
export function parseDoctorReport(text: string): DoctorReport {
  const json = JSON.parse(text) as Record<string, unknown>;
  const summary = (json["summary"] ?? {}) as Record<string, unknown>;
  const checks = Array.isArray(json["checks"])
    ? (json["checks"] as Record<string, unknown>[])
    : [];
  return {
    active: typeof json["active"] === "string" ? json["active"] : null,
    home: typeof json["home"] === "string" ? json["home"] : null,
    platform: typeof json["platform"] === "string" ? json["platform"] : null,
    summary: {
      ok: typeof summary["ok"] === "number" ? summary["ok"] : 0,
      warn: typeof summary["warn"] === "number" ? summary["warn"] : 0,
      fail: typeof summary["fail"] === "number" ? summary["fail"] : 0,
    },
    checks: checks.map((check) => ({
      name: typeof check["name"] === "string" ? check["name"] : "",
      status: typeof check["status"] === "string" ? check["status"] : "",
      detail: typeof check["detail"] === "string" ? check["detail"] : null,
      hint: typeof check["hint"] === "string" ? check["hint"] : null,
    })),
  };
}

/** The short display form of a toolchain tag, e.g. `2026-10-30-a4d8fde7`. */
export function shortTag(tag: string): string {
  return tag.startsWith("nightly-") ? tag.slice("nightly-".length) : tag;
}
