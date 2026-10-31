// The Zed extension for the Monad language: launches `monad lsp`.
//
// The server contract is docs/language-server.md in this repo — stdio
// transport, no CLI flags, capabilities negotiated in the handshake. Zed
// resolves `monad` through the PATH of the Zed process; users install it
// with monadup (see README.md).

use zed_extension_api::{self as zed, Command, LanguageServerId, Worktree};

struct MonadExtension;

impl zed::Extension for MonadExtension {
    fn new() -> Self {
        MonadExtension
    }

    fn language_server_command(
        &mut self,
        _language_server_id: &LanguageServerId,
        _worktree: &Worktree,
    ) -> zed::Result<Command> {
        Ok(Command {
            command: "monad".into(),
            args: vec!["lsp".into()],
            env: Vec::new(),
        })
    }
}

zed::register_extension!(MonadExtension);
