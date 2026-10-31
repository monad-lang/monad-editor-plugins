// Extension entry point: toolchain state, the language server lifecycle,
// and the commands. The contracts implemented here are docs/toolchain.md
// (discovery, monadup driving) and docs/language-server.md (client rules).

import * as vscode from "vscode";
import { Trace } from "vscode-languageclient/node";
import { createMonadClient } from "./client";
import {
  Toolchain,
  capture,
  listToolchains,
  resolveToolchain,
} from "./toolchain";
import { DoctorReport, parseDoctorReport, shortTag } from "./parsers";

/** The command the docs tell users to run to bootstrap everything. */
const INSTALL_COMMAND =
  'curl -fsSL https://monad-lang.org/install | bash && monadup default';

const MONADUP_TERMINAL = "monadup";
const MONAD_TERMINAL = "monad";

class Controller {
  private client: vscode.Disposable | null = null;
  private toolchain: Toolchain | null = null;
  private monadupTerminal: vscode.Terminal | null = null;
  private monadTerminal: vscode.Terminal | null = null;
  private ignoredMissingToolchain = false;

  constructor(
    private readonly output: vscode.OutputChannel,
    private readonly status: vscode.StatusBarItem,
  ) {}

  // --- Toolchain state -------------------------------------------------

  private settings() {
    const config = vscode.workspace.getConfiguration("monad");
    return {
      monadPath: config.get<string | undefined>("monadPath"),
      monadupPath: config.get<string | undefined>("monadupPath"),
    };
  }

  trace(): "off" | "messages" | "verbose" {
    return vscode.workspace.getConfiguration("monad").get("server.trace") ?? "off";
  }

  /** Resolve the toolchain, update the status bar, return the state. */
  async refresh(): Promise<Toolchain> {
    this.toolchain = await resolveToolchain(this.settings());
    this.updateStatus();
    return this.toolchain;
  }

  private updateStatus() {
    const tc = this.toolchain;
    if (!tc || !tc.monadPath) {
      this.status.hide();
      return;
    }
    const tag = tc.env?.active;
    const label = tag ? shortTag(tag) : tc.version ?? "toolchain";
    this.status.text = `$(package) monad: ${label}`;
    const source = tc.source === "monadup-home" ? "monadup" : tc.source;
    this.status.tooltip = new vscode.MarkdownString(
      [
        `**Monad toolchain**`,
        `- active: \`${tag ?? "(unknown)"}\``,
        `- monad: \`${tc.monadPath}\` (${source})`,
        tc.version ? `- version: \`${tc.version}\`` : undefined,
        tc.env?.home ? `- home: \`${tc.env.home}\`` : undefined,
        tc.monadupPath ? `- monadup: \`${tc.monadupPath}\`` : undefined,
      ]
        .filter((line) => line !== undefined)
        .join(`  \n`),
    );
    this.status.show();
  }

  // --- Language server lifecycle --------------------------------------

  async startServer(): Promise<void> {
    await this.stopServer();
    const tc = this.toolchain;
    if (!tc?.monadPath) {
      await this.promptForToolchain();
      return;
    }
    const client = createMonadClient(tc.monadPath, this.output);
    client.setTrace(
      this.trace() === "verbose"
        ? Trace.Verbose
        : this.trace() === "messages"
          ? Trace.Messages
          : Trace.Off,
    );
    try {
      await client.start();
      this.client = client;
    } catch (error) {
      client.dispose();
      this.client = null;
      const action = await vscode.window.showErrorMessage(
        `The Monad language server failed to start: ${error instanceof Error ? error.message : String(error)}`,
        "Show output",
      );
      if (action === "Show output") {
        this.output.show(true);
      }
    }
  }

  async stopServer(): Promise<void> {
    if (this.client) {
      await this.client.dispose();
      this.client = null;
    }
  }

  /** Re-resolve (a switch may have re-pointed the monadup symlink), restart. */
  async restartServer(): Promise<void> {
    await this.refresh();
    await this.startServer();
  }

  // --- Missing toolchain UX --------------------------------------------

  private async promptForToolchain(): Promise<void> {
    if (this.ignoredMissingToolchain) {
      return;
    }
    const pick = await vscode.window.showWarningMessage(
      "No Monad toolchain found. `monad lsp` needs the `monad` binary, installed by monadup.",
      "Install toolchain",
      "Set monad path",
      "Ignore",
    );
    if (pick === "Install toolchain") {
      this.showInstallCommand();
    } else if (pick === "Set monad path") {
      void vscode.commands.executeCommand(
        "workbench.action.openSettings",
        "@ext:monad-lang.monad monad.monadPath",
      );
    } else if (pick === "Ignore") {
      this.ignoredMissingToolchain = true;
    }
  }

  /** Pre-fill the documented install command in a terminal, not run it. */
  private showInstallCommand(): void {
    const terminal = this.ensureMonadupTerminal();
    terminal.show();
    terminal.sendText(INSTALL_COMMAND, false);
  }

  // --- Terminals --------------------------------------------------------

  private ensureMonadupTerminal(): vscode.Terminal {
    if (!this.monadupTerminal) {
      this.monadupTerminal = vscode.window.createTerminal({
        name: MONADUP_TERMINAL,
        message: "monadup — the Monad toolchain manager",
      });
    }
    return this.monadupTerminal;
  }

  private ensureMonadTerminal(): vscode.Terminal {
    if (!this.monadTerminal) {
      this.monadTerminal = vscode.window.createTerminal({
        name: MONAD_TERMINAL,
        message: "monad — compile, run, check",
      });
    }
    return this.monadTerminal;
  }

  onTerminalClosed(closed: vscode.Terminal): void {
    if (closed === this.monadupTerminal) {
      this.monadupTerminal = null;
      // The user finished an install/update/use; re-resolve and restart so
      // the server binary matches whatever is active now.
      void this.restartServer();
    } else if (closed === this.monadTerminal) {
      this.monadTerminal = null;
    }
  }

  // --- Commands ---------------------------------------------------------

  async selectToolchain(): Promise<void> {
    const tc = await this.refresh();
    if (!tc.monadupPath) {
      this.showInstallCommand();
      return;
    }
    const entries = await listToolchains(tc.monadupPath);
    if (entries.length === 0) {
      const pick = await vscode.window.showInformationMessage(
        "No toolchains installed yet.",
        "Install latest",
      );
      if (pick === "Install latest") {
        await this.installLatest();
      }
      return;
    }
    const picked = await vscode.window.showQuickPick(
      entries.map((entry) => ({
        label: shortTag(entry.tag),
        description: entry.tag,
        picked: entry.active,
      })),
      { placeHolder: "Select the active monad toolchain (monadup use)" },
    );
    if (!picked || !picked.description) {
      return;
    }
    const run = await capture(tc.monadupPath, ["use", picked.description]);
    if (run.code !== 0) {
      vscode.window.showErrorMessage(
        `monadup use ${picked.description} failed: ${run.stderr.trim() || run.stdout.trim()}`,
      );
      return;
    }
    await this.restartServer();
    vscode.window.showInformationMessage(`Active toolchain: ${picked.description}`);
  }

  async installLatest(): Promise<void> {
    await this.runInMonadupTerminal("default");
  }

  async updateToolchain(): Promise<void> {
    await this.runInMonadupTerminal("update");
  }

  /** Network-touching monadup commands go through a visible terminal. */
  private async runInMonadupTerminal(subcommand: string): Promise<void> {
    const tc = await this.refresh();
    if (!tc.monadupPath) {
      this.showInstallCommand();
      return;
    }
    const terminal = this.ensureMonadupTerminal();
    terminal.show();
    terminal.sendText(`"${tc.monadupPath}" ${subcommand}`);
  }

  async showDoctor(): Promise<void> {
    const tc = await this.refresh();
    if (!tc.monadupPath) {
      this.showInstallCommand();
      return;
    }
    const run = await capture(tc.monadupPath, ["doctor", "--json"]);
    let report: DoctorReport | null = null;
    try {
      report = parseDoctorReport(run.stdout);
    } catch {
      report = null;
    }
    this.output.clear();
    if (report) {
      const lines: string[] = [
        `monadup doctor — active: ${report.active ?? "(none)"}`,
        `home: ${report.home ?? "(unknown)"}  platform: ${report.platform ?? "(unknown)"}`,
        `summary: ${report.summary.ok} ok, ${report.summary.warn} warn, ${report.summary.fail} fail`,
        "",
      ];
      for (const check of report.checks) {
        lines.push(`[${check.status}] ${check.name}: ${check.detail ?? ""}`);
        if (check.hint) {
          lines.push(`        hint: ${check.hint}`);
        }
      }
      this.output.appendLine(lines.join("\n"));
      const message =
        report.summary.fail > 0
          ? `Toolchain health: ${report.summary.fail} failing check(s).`
          : report.summary.warn > 0
            ? `Toolchain health: ${report.summary.warn} warning(s).`
            : "Toolchain health: all checks pass.";
      this.output.show(true);
      if (report.summary.fail > 0) {
        vscode.window.showWarningMessage(message);
      } else {
        vscode.window.showInformationMessage(message);
      }
    } else {
      // Older monadup without --json, or unexpected output: show it raw.
      this.output.appendLine(run.stdout || run.stderr);
      this.output.show(true);
    }
  }

  async showEnv(): Promise<void> {
    const tc = await this.refresh();
    if (!tc.monadupPath) {
      this.showInstallCommand();
      return;
    }
    const run = await capture(tc.monadupPath, ["env"]);
    this.output.clear();
    this.output.appendLine(run.stdout || run.stderr);
    this.output.show(true);
  }

  /** `monad run`/`check` the active file in the monad terminal. */
  async runFileCommand(subcommand: "run" | "check"): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== "monad") {
      vscode.window.showErrorMessage("Open a .mo file first.");
      return;
    }
    const tc = await this.refresh();
    if (!tc.monadPath) {
      await this.promptForToolchain();
      return;
    }
    const terminal = this.ensureMonadTerminal();
    terminal.show();
    terminal.sendText(
      `"${tc.monadPath}" ${subcommand} "${editor.document.uri.fsPath}"`,
    );
  }
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const output = vscode.window.createOutputChannel("Monad");
  context.subscriptions.push(output);

  const status = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    42,
  );
  status.name = "Monad toolchain";
  status.command = "monad.toolchain.select";
  context.subscriptions.push(status);

  const controller = new Controller(output, status);

  const register = (id: string, run: () => Promise<void>) =>
    context.subscriptions.push(vscode.commands.registerCommand(id, run));

  register("monad.toolchain.select", () => controller.selectToolchain());
  register("monad.toolchain.installLatest", () => controller.installLatest());
  register("monad.toolchain.update", () => controller.updateToolchain());
  register("monad.toolchain.doctor", () => controller.showDoctor());
  register("monad.toolchain.env", () => controller.showEnv());
  register("monad.restartServer", () => controller.restartServer());
  register("monad.runFile", () => controller.runFileCommand("run"));
  register("monad.checkFile", () => controller.runFileCommand("check"));

  context.subscriptions.push(
    vscode.window.onDidCloseTerminal((terminal) =>
      controller.onTerminalClosed(terminal),
    ),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (
        event.affectsConfiguration("monad.monadPath") ||
        event.affectsConfiguration("monad.monadupPath") ||
        event.affectsConfiguration("monad.server.trace")
      ) {
        void controller.restartServer();
      }
    }),
  );

  await controller.refresh();
  await controller.startServer();
}

export function deactivate(): void {
  // The client is disposed via its registration in context.subscriptions.
}
