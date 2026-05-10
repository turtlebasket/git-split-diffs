{
  fetchPnpmDeps,
  lib,
  nodejs_22,
  pnpmConfigHook,
  pnpm_10,
  stdenv,
}:

let
  packageJson = lib.importJSON ./package.json;
  pnpm = pnpm_10.override { nodejs = nodejs_22; };
in
stdenv.mkDerivation (finalAttrs: {
  pname = packageJson.name;
  version = packageJson.version;

  src = lib.fileset.toSource {
    root = ./.;
    fileset = lib.fileset.unions [
      ./LICENSE
      ./README.md
      ./eslint.config.js
      ./jest.config.js
      ./package.json
      ./pnpm-lock.yaml
      ./scripts
      ./src
      ./themes
      ./tsconfig.json
    ];
  };

  nativeBuildInputs = [
    nodejs_22
    pnpm
    pnpmConfigHook
  ];

  pnpmDeps = fetchPnpmDeps {
    inherit (finalAttrs) pname src version;
    inherit pnpm;
    fetcherVersion = 3;
    hash = "sha256-Si1VW9HeDehgbwn/6+lr+0NOVtzIRWfKk/DnhaENjRQ=";
  };

  buildPhase = ''
    runHook preBuild

    pnpm run build:publish

    runHook postBuild
  '';

  doCheck = true;
  checkPhase = ''
    runHook preCheck

    pnpm run lint
    pnpm test

    runHook postCheck
  '';

  installPhase = ''
    runHook preInstall

    pnpm prune --prod

    mkdir -p "$out/lib/${finalAttrs.pname}" "$out/bin"
    cp -R package.json build themes node_modules "$out/lib/${finalAttrs.pname}/"

    chmod +x "$out/lib/${finalAttrs.pname}/build/index.mjs"
    patchShebangs "$out/lib/${finalAttrs.pname}/build/index.mjs"
    ln -s "$out/lib/${finalAttrs.pname}/build/index.mjs" "$out/bin/git-split-diffs"

    runHook postInstall
  '';

  meta = {
    description = packageJson.description;
    homepage = packageJson.homepage;
    license = lib.licenses.mit;
    mainProgram = "git-split-diffs";
    platforms = lib.platforms.unix;
  };
})
