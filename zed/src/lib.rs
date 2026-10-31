// The Zed extension for the Monad language: launches `monad lsp`.
//
// The server contract is docs/language-server.md in this repo — stdio
// transport, no CLI flags, capabilities negotiated in the handshake. The
// extension resolves `monad` on the PATH of the Zed process via the
// worktree; users install it with monadup (see README.md).

use zed_extension_api::{self as zed, Command, LanguageServerId, Worktree};

struct MonadExtension;

impl zed::Extension for MonadExtension {
    fn new() -> Self {
        MonadExtension
    }

    fn language_server_command(
        &mut self,
        _language_server_id: &LanguageServerId,
        worktree: &Worktree,
    ) -> zed::Result<Command> {
        // Zed runs the returned path as-is (a bare name would be resolved
        // against the extension's work directory, not the PATH), so hand
        // it the absolute path.
        let path = worktree.which("monad").ok_or(
            "`monad` was not found on the PATH of the Zed process; install \
             the toolchain with `monadup default` and make sure `~/.monad/bin` \
             is on the PATH Zed sees (see the README)",
        )?;
        Ok(Command {
            command: path,
            args: vec!["lsp".into()],
            env: Vec::new(),
        })
    }
}

zed::register_extension!(MonadExtension);
