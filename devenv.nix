{
  pkgs,
  ...
}:

{
  # The Zed extension is Rust; the VS Code extension needs node only
  # (esbuild + typescript come from npm).
  #
  # Zed compiles extensions against the `wasm32-wasip2` target and calls
  # `rustup target add` when the toolchain lacks it (zed/README.md has the
  # full story). Nix toolchains have no rustup, so the target must be in
  # the sysroot — and the nixpkgs channel cannot add cross-targets, hence
  # the stable channel here.
  languages.rust = {
    enable = true;
    channel = "stable";
    targets = [ "wasm32-wasip2" ];
  };

  packages = [ pkgs.nodejs ];
}
