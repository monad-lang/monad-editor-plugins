// Golden-output tests for the monadup parsers. The fixtures below are
// captured from monadup 0.1.0 (see docs/toolchain.md) — if monadup's output
// format changes upstream, a failing test here is the early warning.

import test from "node:test";
import assert from "node:assert/strict";
import {
  parseDoctorReport,
  parseMonadupEnv,
  parseMonadupList,
  shortTag,
} from "../src/parsers";

const ENV_OUTPUT = [
  "platform:       x86_64-linux   (from uname -sm, Linux x86_64)",
  "home:           /home/user/.monad  (default)",
  "active:         nightly-2026-10-30-a4d8fde7",
  "toolchain root: /home/user/.monad/downloads/nightly-2026-10-30-a4d8fde7 (sources present: 4)",
  "PATH:           /home/user/.monad/bin (present)",
  "compiler:       ../downloads/nightly-2026-10-30-a4d8fde7/monad-nightly-x86_64-linux",
  "tools:          llc=yes, clang=yes, pkg-config=yes, bdw-gc=no",
  "overrides:      (none)",
  "",
].join("\n");

test("parseMonadupEnv reads the keys the extension needs", () => {
  const env = parseMonadupEnv(ENV_OUTPUT);
  assert.equal(env.platform, "x86_64-linux");
  assert.equal(env.home, "/home/user/.monad");
  assert.equal(env.active, "nightly-2026-10-30-a4d8fde7");
  assert.equal(
    env.toolchainRoot,
    "/home/user/.monad/downloads/nightly-2026-10-30-a4d8fde7",
  );
  assert.equal(env.raw["compiler"], "../downloads/nightly-2026-10-30-a4d8fde7/monad-nightly-x86_64-linux");
  assert.equal(Object.keys(env.raw).length, 8);
});

test("parseMonadupEnv handles missing keys", () => {
  const env = parseMonadupEnv("nothing: here\n");
  assert.equal(env.active, undefined);
  assert.equal(env.home, undefined);
});

const LIST_OUTPUT = [
  "  nightly-2026-10-16-36a710fe  36a710f",
  "  nightly-2026-10-17-5c5d79e0  5c5d79e",
  "  nightly-2026-10-30-6a59e090  6a59e09",
  "* nightly-2026-10-30-a4d8fde7  a4d8fde",
  "",
].join("\n");

test("parseMonadupList finds entries and the active marker", () => {
  const entries = parseMonadupList(LIST_OUTPUT);
  assert.equal(entries.length, 4);
  assert.deepEqual(entries[0], {
    tag: "nightly-2026-10-16-36a710fe",
    active: false,
  });
  const active = entries.filter((entry) => entry.active);
  assert.equal(active.length, 1);
  assert.equal(active[0].tag, "nightly-2026-10-30-a4d8fde7");
});

test("parseMonadupList with no active toolchain", () => {
  const entries = parseMonadupList("  nightly-2026-10-16-36a710fe  36a710f\n");
  assert.equal(entries.length, 1);
  assert.equal(entries[0].active, false);
});

const DOCTOR_JSON = JSON.stringify({
  active: "nightly-2026-10-30-a4d8fde7",
  home: "/home/user/.monad",
  home_source: "default",
  platform: "x86_64-linux",
  toolchain_root: "/home/user/.monad/downloads/nightly-2026-10-30-a4d8fde7",
  sources: ["init", "std", "llvm", "runtime"],
  summary: { ok: 17, warn: 0, fail: 1 },
  checks: [
    {
      name: "binary-runs",
      status: "ok",
      detail: "monad version: a4d8fde",
      hint: null,
    },
    {
      name: "boehm-gc",
      status: "fail",
      detail: "boehm-gc not found",
      hint: "install Boehm GC development files (libgc-dev / gc-devel / bdw-gc)",
    },
  ],
});

test("parseDoctorReport extracts summary and checks", () => {
  const report = parseDoctorReport(DOCTOR_JSON);
  assert.equal(report.active, "nightly-2026-10-30-a4d8fde7");
  assert.equal(report.home, "/home/user/.monad");
  assert.equal(report.platform, "x86_64-linux");
  assert.deepEqual(report.summary, { ok: 17, warn: 0, fail: 1 });
  assert.equal(report.checks.length, 2);
  assert.equal(report.checks[1].status, "fail");
  assert.match(report.checks[1].hint ?? "", /Boehm GC/);
});

test("parseDoctorReport tolerates a check without hint or detail", () => {
  const report = parseDoctorReport(
    JSON.stringify({ summary: {}, checks: [{ name: "x" }] }),
  );
  assert.equal(report.active, null);
  assert.deepEqual(report.summary, { ok: 0, warn: 0, fail: 0 });
  assert.deepEqual(report.checks[0], {
    name: "x",
    status: "",
    detail: null,
    hint: null,
  });
});

test("parseDoctorReport throws on invalid JSON", () => {
  assert.throws(() => parseDoctorReport("not json"));
});

test("shortTag strips the nightly prefix", () => {
  assert.equal(shortTag("nightly-2026-10-30-a4d8fde7"), "2026-10-30-a4d8fde7");
  assert.equal(shortTag("other-tag"), "other-tag");
});
