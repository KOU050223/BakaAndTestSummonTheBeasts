{
  description = "Baka and Test: Summon the Beasts";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        pnpmPackage = pkgs.pnpm_10 or pkgs.pnpm;
        goPackage = pkgs.go_1_26 or pkgs.go;
        tesseractJpn = pkgs.tesseract5.override { enableLanguages = [ "jpn" "eng" ]; };
      in
      {
        devShells.default = pkgs.mkShell {
          packages = [
            pkgs.git
            pkgs.go-task
            pkgs.lefthook

            # frontend
            pkgs.nodejs_24
            pnpmPackage
            
            # Go
            pkgs.golangci-lint
            goPackage

            # Ruby on Rails
            pkgs.ruby_4_0
            pkgs.bundler
            pkgs.libyaml
            pkgs.libxml2
            pkgs.libxslt
            pkgs.zlib
            pkgs.openssl

            # OCR・画像処理
            tesseractJpn
            pkgs.imagemagick
            pkgs.ghostscript
          ];

          shellHook = ''
            export GEM_HOME=$HOME/.gem
            export PATH=$GEM_HOME/bin:$PATH
            export TESSDATA_PREFIX="${tesseractJpn}/share/tessdata"
          '';
        };
      });
}
