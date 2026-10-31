// The language client for `monad lsp`. The server contract is
// docs/language-server.md: stdio transport, full-text sync, capabilities
// negotiated in the initialize handshake (which vscode-languageclient does
// for us — including offering position encodings).

import * as vscode from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

export type TraceLevel = "off" | "messages" | "verbose";

/** The client id; `monad lsp` identifies itself as `monad-lsp` in serverInfo. */
export const CLIENT_ID = "monad-lsp";

export function createMonadClient(
  monadPath: string,
  outputChannel: vscode.OutputChannel,
): LanguageClient {
  const serverOptions: ServerOptions = {
    command: monadPath,
    args: ["lsp"],
    transport: TransportKind.stdio,
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ language: "monad" }],
    outputChannel,
    // Trace traffic goes to the same channel; the setting is applied via
    // `client.setTrace` after creation by the controller.
    traceOutputChannel: outputChannel,
  };

  return new LanguageClient(CLIENT_ID, "Monad Language Server", serverOptions, clientOptions);
}
