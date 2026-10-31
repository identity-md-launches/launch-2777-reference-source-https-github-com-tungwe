# Pip's implemented interface

## Overview

Pip is an independent 3D hamster companion for feeding, direct touch, quiet play and read-only chain moments. The upgrade keeps the original lavender studio, dark header, warm cream surfaces and five supplied hamster appearances. The character is the product: the first mobile screen contains Pip and the three snack controls. Source layout and styles are in `src/`; `src/upgrade.css` is the final shared override after the preserved studio/life/chat styles.

## Colors

Canonical semantic values live in `src/upgrade.css`:

| Token | Value | Job |
| --- | --- | --- |
| `--page` | `#f8f4ed` | Warm page background |
| `--surface` | `#fffdf7` | Controls, ordinary panels and floating activity cards |
| `--lavender` | `#eee9f4` | The hamster stage |
| `--ink` | `#3e334d` | Primary text |
| `--muted` | `#68586f` | Supporting text, readable small labels |
| `--line` | `#d7cbdc` | Structural separators and control borders |
| `--accent` | `#735781` | Primary action and links |
| `--accent-hover` | `#61456f` | Darker accent interaction state |
| `--focus` | `#754b13` | Keyboard focus perimeter |
| `--confirmed` | `#365b42` | Confirmed chain status text |
| `--warning` | `#76501d` | Unavailable, removed and simulated status text |

Keep the existing dark header and the original hamster/prop material colors in `studio.css` and `pet-3d.mjs`. No dark-mode palette was added. Network states have readable labels in addition to color. The measured solid-background text pairs passed the design probe; image/3D lighting contrast is not represented by those ratios.

## Typography

Use the existing system sans direction: `Arial, "Noto Sans TC", sans-serif`. The TC name is a fallback request, not a downloaded or verified font. No remote font is needed. Code/data may use the incumbent Consolas fallback; prose uses sans.

The shared six-step scale is 12, 14, 16, 20, 28 and 40px (`--text-xs` through `--text-display`). Body and form input default to 16px; descriptions and compact buttons use 14px; dense supporting labels use 12px; component headings use 20px. The main headline is 40px on desktop and 28px on narrow screens. Weights are 400, 600 and the browser's inherited bold 700. Headings use balanced wrapping; body copy has 1.6 line height and descriptions use pretty wrapping. Display tracking is `-.035em`; content labels have normal tracking. Critical request IDs and transaction evidence remain available in full rather than being clipped; long metadata wraps and grouped links scroll within their own bounded area.

## Layout

The page has a 1200px maximum width, 24px desktop padding and 16px mobile padding. The desktop studio grid uses `minmax(0,1.2fr) minmax(0,1fr)` with a 24px gap. The stage leads; the chain observer is the upper right surface. Existing chat, care, scene, game and stream functions remain available.

At 740px and below, the studio becomes a single column with 16px gaps. The stage has 16px padding and a 200px model mount. The food tray is the first item in its care group, in three equal columns with 10px gaps. The hamster viewport is in ordinary flow: it never sticks over food while scrolling or dragging. At 360px, the secondary logo line and large mark simplify so language and compact sound controls still fit.

Activity cards occupy their own space inside the companion container. At 1120px and above, a visible card sits in a 220px column beside the model; below that it stacks beneath the character/gesture controls, away from the face and projected mouth. History reopening scrolls the requested card into view without moving keyboard focus. The invitation is part of the pet scene, with a held 3D paw/head pose and one keyboard alternative.

When wheel telemetry is unavailable, the speech bubble carries the waiting message once. The reading footer is empty until a fresh sample can supply RPM/time; its provenance line remains. The canvas pauses while hidden or offscreen and uses the last entry in each visibility batch to resume when it returns onscreen.

Observed Chromium widths: 320, 390, 768 and 1440px. The first 390×844 screen showed the model and all three snack controls. Actual browser-native zoom, physical phones and RTL presentation were not tested; 200% root text enlargement was checked separately. English and Traditional Chinese are supported; this is not an RTL product.

## Elevation & depth

Ordinary panels use one structural border and no shadow. The lavender stage is a tonal surface without a surrounding border. The floating activity card uses `0 6px 20px #49315120` and no border. The sound preference popover is anchored to its header control; it is not a modal. There is no full-screen chain notification or focus capture. The mouth target and local touch effects are non-interactive decorative overlays, so the food/pet hit zones remain available.

## Shapes

Use 20px radii for stage/panels, 14px for the activity card and 12px for snack controls. Preserve the existing rounded compact controls and accessory shapes. Do not add rounded containers around every line of information. The canvas keeps its rounded viewport; text containers must be allowed to grow rather than being cut off.

## Components

| Pattern | Source | Behavior |
| --- | --- | --- |
| Header / language / sound | `studio.mjs`, `audio-ui.mjs`, `audio.css`, `upgrade.css` | Name left, utilities right. Sound begins silent; its named icon opens playback and a separate arrow opens settings. Escape closes preferences and returns focus. |
| 3D companion | `pet-3d.mjs`, `character-view.mjs`, `growth-models.mjs` | Five local GLBs, retry on WebGL/model failure, actual raycast touch zones, projected mouth target, separate Pet/Turn modes and Face me. |
| Food / care / memories | `pet-ui.mjs`, `life-ui.mjs` | Three snacks support drag and keyboard activation; existing save locks, cooldowns, games, sleep and elapsed-time growth remain intact. |
| Chain observer | `chain-ui.mjs`, `chain-monitor.mjs`, `chain-config.mjs` | Separate source/network states; live and card preferences; Gentle/Lively; bounded recent provenance and explicit unavailable/empty states. |
| Floating activity card | `chain-ui.mjs`, `.chain-card` | Same-update start with its gesture, network/status, bilingual explanation, identifier, confirmation time and correct explorer. Eight-second lifetime with hover/focus retention, fade, close, history reopen and reorg correction. |
| Expression / invitation | `chain-expression.ts`, `pet-3d.mjs` | Three variations per event family plus three join gestures. Seeded anti-repeat, 3.6-second sequences, stage/energy bounds and smooth settling. Actual paw/head contact and the keyboard alternative grant no care reward. Invitations expire after eight seconds. |
| Rehearsal gallery | `.rehearsal-gallery`, `chain-ui.mjs` | Twelve explicitly simulated previews, persistent simulated stage/card labels and End rehearsal. Fixture previews cannot enter live history. |
| Browser AI | `browser-chat.mjs`, `chat-core.mjs`, `chat-worker.mjs` | Optional Send-to-prepare flow, visible first-download cost, local inference, Stop/retry/compatibility states and bounded context. No wallet, account or paid inference API. |

Interactive states use native disabled controls and visible hover/pressed/focus styles. Comfortable actions are 44px high; smaller incumbent controls meet the 24px minimum/spacing test. Focus uses a 3px perimeter with 3px offset. Body links have underlines rather than relying on color alone. The card has one polite announcement region; it does not duplicate the hamster speech region. The separate join caption announces an explicit user response.

Played chain history stores the selected motion and reuses its caption when reopened or translated. Observed-only entries and older saves without a recorded motion use the event facts without inventing a gesture. These additions stay in the separate chain save; existing pet saves need no migration.

Reduced motion removes CSS entrances and uses static chain poses, with no hopping/twirling/particle bursts. Gentle is default; Lively adds bounded ear/nose detail and amplitude. Neither changes polling, event frequency, reward speed or particle count. Chain gestures reuse the existing unrigged morph system: a victory paw/weight shift is the expressive alternative to pretending that a separate foot or eyelid bone exists.

## Do's and don'ts

- Reuse the lavender stage, cream surface, six type steps and semantic colors. A new page can use the same topbar, centered `main`, native controls and panel pattern with `upgrade.css` last.
- Put interaction directions beside their controls and keep the character and snack action visible on a narrow first screen.
- Preserve explicit labels for telemetry, confirmed chain facts, unavailable reads and simulation. A request is not job completion; settlement is not a wallet payout.
- Keep the renderer, card and event queue coordinated. Do not send animation rewards into the existing care/growth save.
- Keep cards out of mouth/face/input hit zones, preserve focus/hover retention, and use static cues with reduced motion.
- Rebuild source changes and retain canonical local assets and third-party notices. Do not restore root-relative worker paths or a sticky viewport over food.

The six-domain review, fixes, exact commands and unperformed checks are recorded in `artifacts/validation.md`. Design guidance attribution and licenses are retained in `docs/licenses/Better-Interface-LICENSE`.
