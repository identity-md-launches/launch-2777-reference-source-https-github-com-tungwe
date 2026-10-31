# Pip validation and limitations — 31 October 2026

Complete for the reopened **missing-evidence revision**. The report, twelve-sequence gallery and per-gesture results now exist at the paths linked by the README. These are worker observations, not independent certification. Application source, saved-state formats, five models, dependencies and the accepted production export are unchanged.

## Finding, cause and delivery

Finding `6b67a43b85cab97ae3e87791e45e28a79782065f1e49b3ede43ea30f7dd5167a` reproduced before generating anything: `artifacts/` and all three README-linked deliverables were absent; `git ls-files artifacts` returned nothing. README.md:40 therefore promised evidence that was not delivered.

During regeneration, `git check-ignore -v` established that a repository-local exclude also hid `artifacts/`. The correction is a named-file allowlist at `.gitignore:16–26`, respecting the existing **845,000-byte artifacts budget** in `docs/SUBMISSION_BUDGET.md`. It overrides the local exclude without changing Git metadata or admitting dependency/cache directories. Final presence, JSON/image integrity, ignore eligibility and total submission size are checked below. `.imd-responses.json` answers the finding.

The actual submitted evidence is:

- [Twelve gestures, three captured phases each](expression-gallery.jpg).
- [Per-gesture English/Traditional Chinese text assertions and start/finish results](expression-results.json).
- [All 24 rendered bilingual rehearsal cards](card-gallery.jpg).
- [Mobile first screen, narrow Chinese event card and desktop](responsive-gallery.jpg).
- [Dated network reads](live-read.json), [collected executed check results](check-results.json), and [submission size/inventory summary](submission-summary.json).

The JPEGs contain actual production-browser pixels; captions/contact-sheet layout were composed with Sharp. They are not generated illustrations. Selected evidence remains here after disposable `test/scratch/` files are removed.

## Scope and conditions

Reference: `tungweb3/squeekchain-hamster-companion` at `b3f4b1ffee5121984de2ea349fce3a36919ede3c`. Both `docs/SWARM_HANDOFF.md` and `docs/CHAIN_REACTIONS.md` were read. Git blob hashes from GitHub's recursive tree at that commit matched **all 14 original test files byte for byte**. Running those files produced **76 passes, zero failures/skips**. The complete suite produced **112 passes, zero failures/skips**. File hashes and actual output are retained in `check-results.json`.

Node 24.21.0, npm 11.19.0; locked tooling including Playwright 1.64.1 and Chromium 156.0.8078.4. Dependencies, downloaded browser binaries, test-only fonts and caches were installed outside the repository. Production pages were served beneath `/preview/` with the project's CSP and MIME handling. Browser checks used a headless software renderer, not a physical phone or a hardware-GPU benchmark.

The production build and typecheck were actually run. The build's external dependency directory changes its embedded module labels and consequent bundle hashes. Since this revision requires no application-source change, the accepted export was retained instead of submitting that unrelated generated diff. `node tools/verify-export.mjs` validates its complete SHA-256 inventory. Final interaction, chain, design and gesture evidence uses this retained export, entry `assets/code/studio-PUQOYFUA.js`.

Initial screenshots lacked Chinese glyphs. An isolated test font configuration then selected an unsuitable Latin fallback and the first-screen assertion failed. Adding Noto Sans CJK TC and restoring the Arial → Liberation Sans test-font alias corrected the evidence environment; the complete browser suite was rerun successfully. No font or styling change was made to the website. Final Chinese screenshots were visually inspected and are readable. The environment setup is not a claim that this site downloads fonts.

## Executed commands and results

Environment variables `SQUEEK_TOOLS_PACKAGE`, `PLAYWRIGHT_BROWSERS_PATH`, `FONTCONFIG_FILE` and `IMD_PLAYWRIGHT` selected the temporary tooling/browser/fonts. They are not required site configuration. Existing scripts manage and close their preview servers.

| Executed command/procedure | Actual result |
| --- | --- |
| `npm ci --ignore-scripts --no-audit --no-fund` using copied manifest/lockfile in a temporary directory | Exit 0; 41 packages installed; no repository dependencies/cache added |
| `npm run build` | Exit 0; 109 production inventory files; export verifier passed |
| `npm run typecheck` | Exit 0; both new TypeScript modules passed; existing JavaScript is not fully typechecked |
| `node --test` with the 14 pinned baseline test paths | Exit 0; 76/76 passed; files unchanged against pinned upstream |
| `npm test` | Exit 0; 112/112 passed, zero skipped/cancelled/todo |
| `node tools/browser-check.mjs` | Final run exit 0; 15 Chromium interaction assertions passed; WebKit not installed |
| `node tools/chain-browser-check.mjs` | Final run exit 0; 14 recorded-receipt replay assertions passed |
| `node tools/revision-check.mjs` | Exit 0; seven checks passed, including batched visibility and bilingual history retention |
| `node tools/accessibility-check.mjs` | Final run exit 0; five axe states, each 29 rules passed, zero violations; keyboard and root-text-size checks passed |
| `node tools/expression-gallery.mjs` | Final run exit 0; 12 starts, 36 phase captures, 24 language assertions, 12 returns to idle; unchanged care/live history |
| `node test/scratch/revision-evidence/capture-cards.mjs` | Exit 0; 24 screenshots, matching bilingual captions and simulated-source assertions; unchanged care/history |
| `node test/scratch/revision-evidence/compose-responsive.mjs` | Exit 0; composed the inspected production screenshots without replacing their content |
| `node --import ./test/scratch/revision-evidence/rpc-transport.mjs tools/live-read.mjs` | Exit 0; both monitors watching; canonical historical receipts and configured contract identity verified |
| `node tools/ai-browser-check.mjs` | Exit 0; actual ONNX compatibility replies in English and Traditional Chinese; stop/retry/no-late-token checks recorded |
| `node tools/ai-failure-check.mjs` | Exit 0; two controlled download-failure/cancellation assertions passed |
| `node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste --offline` | Exit 0; **15/16 measured checks passed**, one casing finding retained below; zero page errors |
| `node tools/verify-export.mjs` | Exit 0; 109 inventory files, five GLBs, relative URLs and required share metadata passed |
| `node tools/check-budget.mjs` | Exit 0; complete tree and explicit path budgets passed; exact bytes in `submission-summary.json` |

Scratch-only helpers captured extra evidence and routed network reads through the assignment-provided contributor transport. They do not ship with the application. The submitted report/gallery can be regenerated with the existing `tools/expression-gallery.mjs`, `tools/live-read.mjs` and other listed project scripts; a reviewer need not run generators to inspect these delivered results.

## Twelve-sequence acceptance

Gallery: **grown model, Lively**, 520 × 950 CSS-pixel viewport. Each tile shows actual renderer samples at **0.60, 1.35 and 3.30 seconds** after selection. The controlled browser clock checks start and a return to idle at 3.90 seconds. This is explicitly **simulated rehearsal**, with external requests blocked; there is no claim of twelve live transactions. Both stage and cards identify simulation. Every English/Chinese card includes the corresponding caption, simulated confirmation status and no transaction/reward claim. Full observed strings are in `expression-results.json`; the additional card sheet shows their rendered appearance.

All twelve rows passed start, bilingual caption, simulated-source and finish assertions. The loop preserved the saved meals/life fields and left both live chain histories empty. The following table is generated from the observed per-gesture card text:

| # | Sequence / family | English observed caption | Traditional Chinese observed caption | Checks |
| --- | --- | --- | --- | --- |
| 1 | Ear perk & head tilt / curious | A new request! Pip perks up and tilts its head. | 有新請求！Pip 豎耳歪頭打招呼。 | EN + TC + start/idle pass |
| 2 | Peek & sniff / curious | Something new? Pip peeks and sniffs. | 有新動靜？Pip 探頭聞聞。 | EN + TC + start/idle pass |
| 3 | Stand & wave / curious | A new request! Pip stands tall and waves. | 有新請求！Pip 挺起身子揮爪。 | EN + TC + start/idle pass |
| 4 | Paw claps & shoulders / pleased | Batch settled. Time for tiny paw claps. | 批次已結算，小爪爪拍一拍。 | EN + TC + start/idle pass |
| 5 | Bounce & soft landing / pleased | Batch settled. A little bounce, a soft landing. | 批次已結算，輕輕跳起再落地。 | EN + TC + start/idle pass |
| 6 | Cheek paws & sway / pleased | Batch settled. Happy paws and a gentle sway. | 批次已結算，捧著臉頰搖一搖。 | EN + TC + start/idle pass |
| 7 | Quarter twirl & return / celebrate | Completed blocks! A tiny twirl and back to you. | 完整區塊完成！轉個小圈再看向你。 | EN + TC + start/idle pass |
| 8 | Victory & happy paws / celebrate | Completed blocks! Pip raises a victory paw. | 完整區塊完成！Pip 舉爪慶祝。 | EN + TC + start/idle pass |
| 9 | Two-step dance & bow / celebrate | Completed blocks! Two little steps and a bow. | 完整區塊完成！小跳兩步再鞠躬。 | EN + TC + start/idle pass |
| 10 | Tiny high-five / join | Paw to palm. A tiny high-five! | 爪爪碰手心，小小擊掌！ | EN + TC + start/idle pass |
| 11 | Cheek nuzzle / join | A little closer for a cheek nuzzle. | 靠近一點，輕輕蹭蹭臉頰。 | EN + TC + start/idle pass |
| 12 | Shy dip & wave / join | A shy little dip, then a returning wave. | 害羞低下頭，再輕輕揮爪回應。 | EN + TC + start/idle pass |

These are unrigged supplied meshes. Motions use bounded ear/head/body/paw deformation and orientation; the victory gesture uses a paw/weight-shift alternative rather than an invented articulated foot/eyelid bone. Numerical tests cover all five stages, bounded deformation, seeded anti-repeat, timing/settling, reduced motion, invitations and priority. This sheet visually samples the grown stage; it is not a 12 × 5 model gallery or video evidence.

## Live reads and replay provenance

Fresh read timestamp: **2026-10-31T13:41:39.865Z**. Reads used the assignment-provided contributor transport; public provider names below are the configured source labels, not a direct-browser availability test. Only allowlisted `eth_*` read methods were used. No transaction was sent.

| Source | Chain / contract | Fresh head → confirmed cursor | Current-block matching logs |
| --- | --- | --- | --- |
| IMD | Ethereum mainnet, chain 1; Intake `0xa43e6f75ee006411f79ac1c84120606c2330de82` | 26,313,109 → 26,313,106; 3 blocks behind head | 0 |
| Squeekchain | Sepolia **testnet**, chain 11155111; SqueekCore proxy `0x74665daeca35a2303e767e76a2ff1fb6f93e119f` | 12,034,200 → 12,034,188; 12 blocks behind head | 0 |

Public source labels: `https://ethereum-rpc.publicnode.com`, `https://eth.llamarpc.com`, `https://ethereum-sepolia-rpc.publicnode.com`, `https://0xrpc.io/sep`. Both monitors reported `watching`, with empty errors and no newly observed events. This bounded read does not establish prolonged liveness or a newly arriving event.

Historical events reverified during those fresh reads:

- IMD `Requested`, canonical successful receipt at Ethereum block **26,312,391**: [source transaction](https://etherscan.io/tx/0x754069ff3e07dc637be4cc27d0985c13335e488dacd22a1460da6d580d9f21d5), request `0x52d5dfa2cd3c79e5e0938bfd6994de7a548e9c650b0968ea8530059f27741179`.
- SqueekCore `BatchSettled`, canonical successful receipt at Sepolia block **11,999,145**: [source transaction](https://sepolia.etherscan.io/tx/0x502d216baff7732ac31ab59b8e3b44911b33834c6b3ca5ad3b7e1c18fbd20eb0), round **1973**, previous round **1972**, cumulative units **13,095,604,188,187**. This recorded zero-work settlement is not evidence of a positive completed-block delta.

Browser chain tests intercept RPC responses to replay these fixed public fixtures through the production decoder, monitor, renderer and card UI. Their clocks remain tied to the recorded blocks. They verify actual curious/pleased motions, mainnet/Sepolia explorer mapping, confirmation labels, both languages, no reward/focus steal, direct raycast join, keyboard join, close/history reopen, narrow geometry, deferred sleep/chat reactions and reorg correction. They are **historical replay**, not fresh event delivery. Positive completed-block deltas, grouped bursts, deduplication, reconnection/backoff, hidden-tab suppression, cooldowns and eating/touch priority are deterministic test cases; synthetic positive-delta UI cases in the regression harness are not attributed to the zero-work live receipt.

## Better Interface review: six domains

The pinned Better Interface workflow, all six core domains, design-documentation section and design-critic thresholds were read. Review preserves the existing lavender/cream companion and its implemented tokens/components in root `DESIGN.md`; this revision does not redesign accepted behavior.

| Domain | Coverage and evidence | Limits |
| --- | --- | --- |
| Accessibility — Checked | Native controls/labels and focus rules (`src/upgrade.css:4`, `src/chain-ui.mjs:12,28`); keyboard feed/join/Escape; focus/hover retention without focus steal; five axe states, reduced-motion rendering | No screen-reader session, forced-colors or physical-touch test. Axe leaves `aria-prohibited-attr` and `color-contrast` items incomplete; zero violations is not full compliance. |
| Layout — Checked | 320/390/768/1440 widths; no horizontal overflow; 390 × 844 first-screen food bottom **841.375px**; projected-mouth drag works; narrow event card does not overlap model/food (`src/upgrade.css:7,11,21`) | Only named viewports. Native zoom, RTL mirror and every translated/content-length combination unperformed. |
| Writing — Checked | Existing voice and controls; per-gesture bilingual explanations; simulation/confirmed/unavailable distinctions; request is not completion, settlement is not payout (`src/chain-ui.mjs:28–49`) | Automated text checks and worker reading, not professional translation review. Existing uppercase offline status retained below. |
| Typography — Checked | Source six-step scale (`src/upgrade.css:2–6`); rendered English/TC wrapping, long request ID and card metadata inspected; probe type-family/size/tracking checks passed | CJK requires a capable system fallback. `html{font-size:200%}` script is not native zoom and px-based type tokens may not enlarge. |
| Colors — Checked | Source role tokens; probe resolved-solid-background contrast, status text plus labels; contrast check reported all measured text meets 4.5:1 (3:1 large) | No invented exact ratios. Probe cannot certify all composited/image/mesh/focus-boundary pairs; axe incomplete contrast items remain manual work. No dark theme exists. |
| UI — Checked | Cards, loading/unavailable states, retained focus/hover, dismiss/reopen, invitations, 12 procedural sequences and static reduced-motion case (`src/upgrade.css:8,13,22`) | Not a 10%-speed DevTools Animations inspection; audio not listened to; screenshots are still phases, not motion capture. |

Measured taste checks passed: render, layout, targets, contrast, tracking, eyebrows, type sizes, type faces, glyphs, slogans, repetition, copy budget, chrome, motion and share. Share metadata includes title, description, favicon, `og:title` and `og:image`; export integrity checked the files and relative URLs.

**Retained low-priority review observation:** at 1440px with requests deliberately blocked, `#connection` displays `SOURCE OFFLINE` (`src/companion-i18n.mjs:2`, rendered by `src/studio.mjs:24`). The casing probe flags this one existing status label. It truthfully distinguishes unavailable telemetry, and changing accepted product copy is outside this missing-evidence revision. No first-screen obstruction or repeated layout failure was found in the final runs. The earlier font-setup assertion failure was corrected in the test environment and is not concealed as a passing run.

## AI, timing and unperformed checks

The actual browser had a WebGPU API but **no available adapter**. It therefore used the free ONNX compatibility path. In a fresh browser context the first download reached 627 MB in the status log, then an English reply completed at about **39 seconds**. A reload with a Traditional Chinese prompt completed in **29 seconds**. Stop during another generation held the displayed reply stable; retry started; no `<think>`/`<analysis>` markers appeared. Controlled blocked-download testing offered retry/compatibility while feeding remained usable. No inference API, account, owner computer or paid service was used.

The reload recorded one ONNX request and a 1,058-byte transfer record, with no `.onnx` entries reported by the script's CacheStorage filter. That establishes a successful reload, **not fully offline cached-model inference**. Hardware WebGPU/MLC first/cached inference, physical-phone memory/performance, model-cache eviction and prolonged model/network failure were not established. Actual outputs, state transitions, errors and cache observations are preserved in `check-results.json` rather than inferred from lifecycle unit tests.

Measured renderer timing from the accessibility run: **44 requestAnimationFrame intervals**, median **23.8ms**, p95 **31.7ms**, Chromium ANGLE/Vulkan SwiftShader. Other automated browsers were running. These are frame-delivery samples on this headless software renderer, not a universal FPS, GPU execution-time or physical-device claim. Controlled-clock phase capture is a separate procedure.

Further unperformed/limited checks: WebKit binary absent; Firefox, native mobile browsers, screen-reader interaction, browser-native 200% zoom, manual contrast for all composited states, actual audio listening, OBS integration, exhaustive five-stage × twelve-gesture visuals, real prolonged reorg/reconnection and fresh positive-block celebration. Source/resource links were inspected under the static subpath, and baseline test-file hashes were compared with the pinned GitHub tree; every external destination's long-term availability is not certified. Unit tests use deterministic scaffolding for adverse chain/cache/storage/worker conditions.

No deployment, IPFS pin, VPS/DNS change, owner-machine access, paid job, wallet connection or transaction was performed. GitHub submission/publication is left to the assignment's submission process; no remote push is claimed. Final scope is the restored evidence and its inclusion fix, with accepted website behavior preserved.
