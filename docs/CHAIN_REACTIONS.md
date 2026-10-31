# Chain-aware Pip — required Swarm feature

## Purpose

Make Pip feel connected to the IMD and Squeekchain ecosystems through free, read-only onchain observations. Show a short explanation and an explorer link for each real trigger; the pet reacts with 3D movement rather than a text box alone. English default, Traditional Chinese available. No wallet is required to play or observe.

## Minimum event mapping

| Source | Verified event | Suggested reaction |
| --- | --- | --- |
| IMD on Ethereum mainnet | A new confirmed request from the official Intake (decode Requested with current ABI) | Pip perks its ears, looks around and waves: "Someone started a new build!" |
| Squeekchain deployment currently identified in official docs (Sepolia as of this brief; label testnet clearly) | SqueekCore BatchSettled | Pip does a small happy bounce: "A new batch has settled!" |
| SqueekCore settled cumulativeBlockUnits crosses a completed-block boundary | Derived increase, not an invented per-block event | Pip claps or twirls with a short celebration: "Another Squeek block!" |

IMD accepted-work receipts from WorkRegistry and Squeek mint/merge/rewards can be added only if decoded against verified official contracts and delivered without compromising the required minimum. Completion of an IMD job in an offchain API is not itself proof of an onchain receipt. Label enriched API information separately. Do not infer token prices, trading recommendations or income from event activity.

## Authenticity and chain configuration

## Richer expression and direct response (owner addition)

Build at least 12 visibly distinct short procedural sequences using the existing five 3D models, not 12 captions over one repeated bounce. Reuse existing deformation/pose/prop systems; no new paid assets or model generation. Do not assume these unrigged models have eyelid/jaw bones. Use achievable ear/body/cheek/head/paw gestures; if a requested anatomical motion cannot be isolated, document an expressive alternative rather than distorting the mesh. Keep feet grounded, proportions cute and deformation bounded across all five stages.

| Moment | Motion variations to implement |
| --- | --- |
| New IMD request: curious | Ear perk + head tilt; peek left/right + nose sniff; stand a little taller + small wave |
| Squeekchain settlement: pleased | Two tiny paw claps + shoulder wiggle; small bounce + soft landing; hold paws near cheeks + happy sway |
| Completed-block celebration: excited | Quarter-turn twirl + face the viewer; little victory pose + one foot tap; two-step wiggle dance + bow |
| User joins the celebration | Raise a paw for a high-five; lean toward the touch + cheek nuzzle; shy head dip + tiny returning wave |

These are suggested concrete sequences; preserve their distinct silhouettes/timing and supply an acceptance gallery/report of all 12. Allow at least three variations for each required event family. Avoid choosing the immediately previous variation for the same family; keep selection reproducible under seeded tests.

### Make it feel responsive

- Let the same event look different with age and current care state: a small seated baby wiggles its paws, while a standing stage can do a small turn. A sleepy pet gives a subtle ear twitch/sigh and goes back to rest. Events never forcibly wake it. An eating pet can glance after chewing finishes; keep the four-second meal intact. Mood comes from existing virtual care state, not invented chain sentiment.
- Offer a short, optional invitation after a celebration: a raised paw is a high-five target directly on the pet; a gentle head lean invites a stroke. Use existing canvas hit zones and visible character gestures, not a row of text-box buttons. Keyboard access and an accessible label must remain available. Let invitations expire quietly without penalties, a modal, countdown pressure or forced response.
- A tap/stroke within the invitation window gets the matching high-five, nuzzle or wave; a repeated tap can get another harmless variation but cannot replay the chain celebration or grant extra care/daily rewards. Never intercept food dragging, Turn mode, sleep controls or chat typing. Cancel invitations when the user starts another action.
- Add a soft anticipation-to-action-to-settle curve: brief glance, 2–4 second gesture, smooth return to breathing/idle. Optional small hearts/sparkles and distinct synthesized chirps may accompany the motion, with strict count/duration limits. Keep all audio opt-in and preserve mute, sound effects/music independence and reduced motion. Reduced-motion mode uses a gentle static pose/caption instead of hopping/twirling/particle bursts.
- Provide Gentle / Lively expressiveness settings, default Gentle. Lively changes motion variety and amplitude within safe bounds; it does not increase RPC polling, event frequency, particle budgets or reward speed. Chain celebrations remain rate limited; user touches still react immediately when allowed.
- Include short bilingual caption variants appropriate to the verified trigger, e.g. "A new build! Shall we wave?" / "有新作品要開工了，要一起揮手嗎？" and "A batch has settled — tiny happy paws!" / "一批資料結算好了，小爪爪開心一下！". Captions must never announce money earned, a job completed, or a wallet reward based only on a request/settlement event.
- A compact local keepsake may record the latest handful of confirmed chain moments with transaction provenance. It is separate from care XP/daily wishes and capped; do not store wallet tracking or duplicate confirmations. If chat mentions a recent chain moment, supply only verified, bounded, allowlisted event facts as context; no LLM call is required for animations or canned captions.

### Expression acceptance

Test variant anti-repeat, action start/finish, five-stage bounds, smooth return to idle, direct hit target vs background, invitation expiry/cancellation, keyboard equivalent, zero duplicate rewards, eating/sleep/chat priority, reduced motion, muted audio and capped particles/cursors/keepsakes. Show each distinct sequence in an explicitly labelled animation rehearsal that never writes live event history or care rewards. Report actual device/frame timing; no universal FPS or phone claim without measurement. Browser-only procedures must not require owner-PC inference or paid generation.

## Verified chain configuration

## Required floating activity card synchronized with the pet

When a confirmed chain event actually starts its pet reaction, show a small floating activity card beside the pet within the same animation frame/update. This card explains why Pip is moving. A speech caption alone or an event log elsewhere is insufficient. Do not show an event card for unrelated idle motion, manual petting or an AI reply.

Each card must include:

- A readable network badge, e.g. IMD / Ethereum mainnet or Squeekchain / Sepolia testnet, and a confirmed-status label based on the actual confirmation policy.
- A short bilingual title and explanation of the action-to-event mapping: "New IMD build request — Pip is waving hello", "Squeekchain batch settled — Pip is doing a happy bounce", or "2 Squeek blocks completed — Pip is celebrating". Use actual decoded values; an IMD request is not a completed job, settlement is not a wallet payout, and completed-block counts are derived from the verified settlement.
- Event/round identifier where applicable, confirmed time, short transaction hash, and an external explorer link for the correct chain. Label a grouped burst with its event count and allow inspection of the individual source transactions. Never display an unrelated transaction as evidence.
- A close control, a pause/disable-card preference separate from sound, and a way to reopen the latest event details from the compact recent-events history.

The card follows the pet stage/container rather than the page corner, repositions inside the viewport, and does not cover its face, mouth/food-drop target, gesture controls or chat input. Reserve sufficient space on narrow screens; touch targets remain usable. It is non-modal, never captures focus automatically, and uses pointer events only over its own controls so petting/dragging outside the card still works. Use a polite accessible announcement without duplicating the existing speech/live region. Provide keyboard-readable details and a clear focus-visible close/link control.

Default duration is about 8 seconds with a smooth fade; hovering or keyboard focus keeps it visible. It must not disappear while a user is activating its link. Closing a card does not replay the event or grant a reward. Reduced motion avoids flying/sliding effects. A bounded history preserves the explanation after auto-dismissal; cards and history use safe text rendering rather than HTML from external event metadata.

Queue/coalesce event cards with their corresponding animations. If an event reaction is deferred by eating/sleep/user action, its card must not announce that Pip is already dancing; show it when the reaction starts, or label the history entry as observed without a played reaction. Old backlog never becomes a stack of popups. If a displayed event is later invalidated by a reorg, correct its card/history to removed or unconfirmed and retract derived totals; do not keep a false confirmed claim.

Distinguish visual sources: chain-confirmed activity cards, live wheel telemetry, connection unavailable, and explicitly simulated rehearsal are different labels/styles. Network failures must not invent chain events. The reaction demonstration must show a clear persistent simulated badge on both the stage and its cards.

Acceptance evidence must show each required event family with its actual animation and matching card, English/Traditional Chinese, narrow-screen positioning, hover/focus retention, close/history reopen, correct explorer mapping, grouped bursts, deferred reactions and reorg correction. Test that direct feeding/touch remains available around the card, there is no focus steal or duplicate announcement, and no card creates a transaction or changes care rewards.

## Verified chain configuration (continued)

Before implementation verify chain IDs, official deployment addresses, start blocks, proxy implementations and current ABIs using official sources. Record checked-at dates and sources in a committed chain manifest; do not guess events from function names. Squeekchain is settled on its documented host chain; do not present it as a generic independent EVM RPC. Use bounded eth_getLogs/receipt/state reads through free public CORS-compatible providers; no paid provider or embedded key. Keep IMD chain 1 and Squeekchain's verified chain separate. Allow future deployment changes through explicit configuration and re-verification.

For SqueekCore use BatchSettled/RoundRecorded semantics from official Index events. There is no per-block event: derive completed blocks using cumulativeBlockUnits / 1_000_000_000. One settlement may complete several blocks; zero-work settlements still advance the frontier. Do not count a checkpoint and its SQK mint transfer twice. Public wheel RPM remains telemetry and must be labelled separately from chain-confirmed events.

## Reliability and play behavior

- Initialize at a confirmed baseline without playing old history. Persist a bounded cursor per chain/source; no full-chain scan on each page visit. Poll with bounded ranges, backoff on rate limits/errors and pause while hidden. If a free provider cannot serve logs reliably, show unavailable and report the limitation; do not replace it with fabricated activity.
- Verify emitter, chain and canonical block hash; use a documented confirmation policy and expose pending/confirmed status. Track occurrence identity with chainId, blockHash, transactionHash and logIndex. Roll back derived state on a reorg and avoid re-celebrating the same transaction/log after re-inclusion or reload. Keep consumer cursor progress separate from pet growth.
- Queue at most a small bounded set of reactions, coalesce busy bursts, and use a configurable cooldown (default at least 15 seconds between chain celebrations). Eating, sleep, user touch and an AI reply take priority; never cancel a committed meal. Honor reduced motion, mute and independent audio preferences. Provide a live-reactions toggle and a compact recent-events list.
- Give each trigger an English/Traditional Chinese label, chain, event type, observed/confirmed time and transaction explorer link. Aggregate-derived block celebrations still link the source settlement. API summaries alone cannot receive a chain-confirmed badge.
- Chain events do not grant money/tokens, send transactions, accelerate elapsed-time growth or change the real hamster. No notifications, sign-in, private-wallet tracking, telemetry server or creator-PC connection. Explicit rehearsal fixtures remain visibly simulated and never enter live history.

## Acceptance evidence

Both required networks/sources must have a working implementation. Provide deterministic tests for event decoding, emitter/chain rejection, confirmation, duplicate logs, reload, out-of-order delivery, zero-work batches, multi-block deltas, rate limits/disconnect, bounded catch-up, reorg rollback, burst coalescing, and interaction priority. Use fixed recorded public receipts with provenance for reproducible tests, plus a dated live read from each source. Distinguish historical fixture/replay, live observation and real-time new-event delivery in the report. A fixture demonstration is not proof that a new live event arrived during testing. No transactions may be sent to manufacture a test event.

## Official references

- https://imd.fun/docs/ (Intake, WorkRegistry, deployment records and public read APIs)
- https://docs.squeekchain.com/developers/quickstart/
- https://docs.squeekchain.com/developers/index-events/

Deliver code and corresponding bundles plus tests/evidence for review. Do not deploy to hamster.imdember.com, pin IPFS, modify VPS/DNS, or spend anything. If the exact planned job does not include this feature, report the mismatch before payment.
