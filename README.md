# Pip · Squeekchain Hamster Companion

Feed, touch, turn and grow with Pip. This upgrade preserves the existing lavender 3D companion, five growth appearances, browser saves, care/play/memories, English default, Traditional Chinese and free on-device AI. It adds read-only IMD/Ethereum and Squeekchain/Sepolia monitoring, twelve procedural gestures, reward-free invitations and synchronized activity cards.

Starting reference: [tungweb3/squeekchain-hamster-companion](https://github.com/tungweb3/squeekchain-hamster-companion/tree/b3f4b1ffee5121984de2ea349fce3a36919ede3c), commit `b3f4b1ffee5121984de2ea349fce3a36919ede3c`. The original work is independently produced; no official review, affiliation or award badge is claimed. [Upstream README](docs/UPSTREAM_README.md), [rights](RIGHTS.md).

## Install, build and preview

Use Node.js 22 or newer:

```sh
npm ci
npm run build
npm start
```

Open `http://127.0.0.1:4321/`. The build compiles the TypeScript event decoder and expression engine, rebuilds versioned browser bundles from `src/`, regenerates Three.js 0.180.0 from the locked dependency, copies pages/styles/notices, and verifies a SHA-256 export inventory. It is an actual rebuild, not an import-only hosting check.

`dist/` is the complete committed static export. `dist/assets/` is also the canonical checked-in input asset set: keep it when rebuilding. This avoids shipping duplicate model/audio trees inside the 8 MiB submission budget. Source belongs in `src/`; edit it and rebuild. Do not edit hashed bundles. `dist/build-manifest.json` records the exact output hashes. No model weights, npm registry, caches or dependency archives are vendored.

Serve the export with JavaScript MIME for `.mjs`/`.js`, `application/wasm` for WASM and `model/gltf-binary` for GLBs. All page/worker/runtime asset requests resolve relative to the export, including beneath `/preview/` or an IPFS gateway subpath. Use the supplied `_headers` CSP where supported. `/source/`, `/observatory/` and `/overlay/` have exported index pages; use their trailing slashes. No server-side application, credentials or wallet is required.

## Validate

```sh
npm test
npm run typecheck
npx playwright install chromium
npm run test:browser
npm run test:chains:browser
npm run test:accessibility
node tools/expression-gallery.mjs
node tools/live-read.mjs
```

The scripts manage their own temporary preview servers and close them. Browser artifacts in `test/scratch/` are disposable; the submitted report and selected evidence are under `artifacts/`. Typecheck covers both new TypeScript modules. Existing JavaScript is exercised by the baseline and reliability tests and checked by the production bundler.

Actual worker results and coverage limits: [validation report](artifacts/validation.md), [implemented design](DESIGN.md), [chain manifest](docs/chain/manifest.json), [gesture gallery](artifacts/expression-gallery.jpg). The supplied 76 tests remain unchanged and are part of the larger test suite. Browser replay tests use recorded public receipts and explicitly report that they are historical replay, not newly arriving live events.

## Chain behavior

The exact addresses, ABIs, deployment blocks, code hashes, public providers and confirmation policies are committed in `docs/chain/` and `src/chain-config.mjs`. IMD monitors `Requested` from the current non-proxy Intake on Ethereum mainnet, three blocks behind the head. SqueekCore V3 monitors `BatchSettled` through its verified proxy on Sepolia **testnet**, twelve blocks behind the head. Completed Squeek blocks are derived from changes in `cumulativeBlockUnits / 1_000_000_000`; no invented per-block event, mint double-counting or token-price inference is used.

The watcher starts at a confirmed baseline without replaying old history. It checks emitter, chain, canonical hash, successful receipt, implementation/runtime identity and settlement state. Cursors/history are separate from pet growth. Reorgs retract cards and derived deltas; a transaction-relative receipt ordinal prevents duplicate celebrations after a log moves to another block/global log index. Reads use 96-block pages, at most 512 catch-up blocks, capped queues/history and backoff. Hidden tabs stop polling. Network failures show unavailable, never fabricated activity.

A confirmed event's card starts in the same renderer update as its gesture. Cards identify the network, policy, identifier, confirmation time and actual source transaction. Hover/focus retains them; close, independent card/live preferences and recent-history reopen are available. Eating, sleep, touch, turn, games and AI/chat input take priority. An invitation's actual paw/head hit target or keyboard equivalent gets a separate gesture without care rewards. Gentle is default; Lively adds safe motion detail, not more polling or rewards. Reduced motion uses static poses. Existing sound stays opt-in; chain features do not enable it.

Free providers can restrict archival reads or fail temporarily. Future contract/deployment changes require explicit configuration and ABI/code re-verification; an unknown implementation stops projection. This is a public-RPC observer, not a consensus light client or an audit of the entire Squeekchain governance/mining graph.

## Browser AI and privacy

Send starts a browser worker. Compatible WebGPU devices use pinned Qwen3-0.6B MLC q4f16 with WebLLM 0.2.87 (about 360 MB); compatibility mode uses pinned ONNX q8 with Transformers.js 3.8.1 (about 650 MB). Exact model revisions and runtime URLs remain in the worker and notices. Completed caches can be reused; Stop terminates the worker and late events cannot update a replaced session. GPU failure offers an explicit compatibility retry.

To fit the submission budget, optional AI runtime libraries are downloaded at exact-version public CDN URLs, and the MLC model library at a pinned GitHub commit. Their licenses remain local; inference stays in the visitor's browser. Download hosts receive download requests, not prompts or replies. No paid inference API, owner-computer connection, account, private wallet tracking or transaction code is added. AI is optional and some devices cannot load these models. The report distinguishes deterministic lifecycle tests from actual hardware/model-loading evidence.

## Models, audio and ownership

All five supplied Tripo model identities remain local GLBs. They were fetched from the pinned source, then optimized to roughly 4,000–4,500 vertices and 512px WebP textures per appearance; original hashes and optimization results are retained in `docs/`. Geometry remains unrigged; bounded morphs provide achievable gestures rather than claiming eyelid or limb bones. `tools/optimize-models.mjs ORIGINAL_GROWTH_DIRECTORY` reproduces the optimization from the original archive with locked tooling. Original WAVs and lossless FLAC playback assets remain complete.

Owner-created code/art/audio retain their existing rights. Three.js, Viem, bundled dependencies, browser AI runtimes and the design guidance retain their notices/licenses in `dist/vendor/` and `docs/licenses/`. See [RIGHTS.md](RIGHTS.md). No deployment, IPFS pin, VPS/DNS change, owner-machine access, transaction or additional paid job was performed. The source and matching export are ready for the assignment's submission process.
