{
  pkgs,
  ...
}:

{
  # The Zed extension is Rust; the VS Code extension needs node only
  # (esbuild + typescript come from npm).
  languages.rust.enable = true;

  packages = [ pkgs.nodejs ];
}
