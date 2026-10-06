{
    description = "web - Vegard Bauge's personal website";

    inputs = {
        nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    };

    outputs = { self, nixpkgs }:
        let
            systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
            forAllSystems = function:
                nixpkgs.lib.genAttrs systems (system: function nixpkgs.legacyPackages.${system});
        in
        {
            devShells = forAllSystems (pkgs: {
                default = pkgs.mkShell {
                    packages = with pkgs; [
                        nodejs_24
                    ];

                    shellHook = ''
                        echo "web dev shell"
                        echo "  node  $(node --version)"
                        echo
                        echo "  npm ci           install into ./node_modules"
                        echo "  npm run dev      vite on http://localhost:5173"
                        echo "  npm test         vitest"
                        echo "  npm run check    svelte-check"
                    '';
                };
            });

            packages = forAllSystems (pkgs: rec {
                default = web;

                # A production build: `nix build` produces the adapter-node server.
                web = pkgs.buildNpmPackage (finalAttrs: {
                    pname = "web";
                    version = "0.1.0";

                    src = self;

                    npmDepsHash = "sha256-XfZuvkkEu8VGHUM+tnE1Exy8BaHKeV5PKbEYznFobRY=";

                    nativeBuildInputs = [ pkgs.makeWrapper ];

                    # tsconfig.json extends .svelte-kit/tsconfig.json, which only svelte-kit sync
                    # produces - so it has to run before vite build, not as part of it.
                    preBuild = ''
                        npx svelte-kit sync
                    '';

                    # buildNpmPackage's default install expects a `bin` in package.json. This is a
                    # server, so ship adapter-node's output plus the runtime dependencies and a
                    # launcher.
                    installPhase = ''
                        runHook preInstall

                        # adapter-node leaves a handful of imports external rather than bundling
                        # them, so node_modules has to ship - but only the production half. That is
                        # why @sveltejs/kit sits in dependencies rather than devDependencies.
                        # svelte itself is NOT needed - the compiler output is self-contained for
                        # SSR.
                        npm prune --omit=dev --no-save

                        mkdir -p $out/lib/web
                        cp -r build package.json $out/lib/web/
                        cp -r node_modules $out/lib/web/node_modules

                        mkdir -p $out/bin
                        makeWrapper ${pkgs.nodejs_24}/bin/node $out/bin/web \
                            --add-flags "$out/lib/web/build/index.js"

                        runHook postInstall
                    '';

                    meta = {
                        description = "Vegard Bauge's personal website";
                        homepage = "https://github.com/kake21/web";
                        mainProgram = "web";
                    };
                });
            });

            apps = forAllSystems (pkgs: {
                default = {
                    type = "app";
                    program = "${self.packages.${pkgs.stdenv.hostPlatform.system}.web}/bin/web";
                };
            });

            formatter = forAllSystems (pkgs: pkgs.nixfmt-rfc-style);
        };
}
