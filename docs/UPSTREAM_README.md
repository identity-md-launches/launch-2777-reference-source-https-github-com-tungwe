# Squeekchain Hamster Companion

An independent 3D virtual hamster companion: touch, drag-to-feed, five growth appearances, care rituals, memory/seed games, and reactions to Squeekchain public wheel telemetry. English defaults; Traditional Chinese is available. This project is not an official Squeekchain product.

Live owner-operated site: https://hamster.imdember.com/

## Run and test

Node.js 22 or newer; no npm dependency installation is required.

```sh
npm test
npm run build
npm start
```

Open http://127.0.0.1:4321/. `dist/` is the committed, ready-to-host static export, including readable ES modules, hashed browser bundles, five original GLBs, smaller web derivatives, audio and vendored runtimes. Build validates the export; it does not regenerate the committed bundles. When changing readable entry modules, Swarm must also update affected bundles/HTML references and demonstrate that both match.

## Hosting

Serve `dist/` over HTTPS. `/`, `/source/`, `/overlay/`, and `/observatory/` have index pages; directory index routing is required. `_headers` describes production CSP and security headers for hosts that support that convention. Configure JavaScript MIME for `.mjs`, WASM for `.wasm`, model/gltf-binary for `.glb`, and audio/flac for `.flac`. Site paths are root-relative: IPFS delivery needs a domain/subdomain gateway preserving root paths, or a separately tested path-prefix adaptation. Do not assume a bare `/ipfs/CID/` path works. Preserve CSP, worker permissions, and model-download allowlists when evaluating IPFS hosting.

The original site's source-download link points to a release ZIP. Recursive downloadable ZIPs are intentionally omitted from this repository. For this snapshot use GitHub's source archive instead. Swarm should update the source/download links in its delivered copy, without altering the production VPS.

## Free browser AI and privacy

Chat begins preparing only after Send. Compatible graphics devices use pinned Qwen3-0.6B MLC q4f16 via WebLLM (first setup about 360 MB); compatibility mode uses pinned ONNX q8 via Transformers.js (about 650 MB). Existing caches can be reused. Model weights are fetched from Hugging Face and are not committed. Inference and prompts remain on the visitor's device; there is no owner-PC endpoint, account, paid AI API, microphone, wallet, or transaction. Chat disappears on reload. Care saves stay in the visitor's browser. Some devices lack memory or GPU support.

## Assets and rights

Five owner-generated Tripo models and original synthesized audio are supplied for this project. Runtime dependencies retain their notices in `dist/vendor/`. See `RIGHTS.md`. No new blanket open-source license is granted for owner-created code or artwork in this snapshot.

## Swarm handoff

Read `docs/SWARM_HANDOFF.md`. This is independently produced work handed over for concrete maintenance, compatibility fixes and review. It has not passed an official Swarm review and no badge is claimed. Do not edit DNS, the current VPS, IMD EMBER WORLD or other owner projects. No automatic deployment, paid services, wallet connection, transactions or repository workflows are configured.

Baseline: 76 automated tests passed; the live release passed 106 public-file verification checks. Real Chrome English/Chinese AI and audio were exercised. Physical-phone and OBS application testing remain incomplete.
