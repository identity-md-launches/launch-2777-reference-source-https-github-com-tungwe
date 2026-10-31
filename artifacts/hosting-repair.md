# Genesis VISIT link: hosting diagnosis and blocker, 31 October 2026

**Result: not repaired by this job. A platform blocker remains.** The Genesis VISIT link still points at a host that fails the TLS handshake. This job has no supported, project-owned control that changes that URL. The working destination has been verified. The two platform components that must change are identified below. No site code was changed and no change is presented as a fix.

Evidence: [`hosting-check.json`](hosting-check.json), written by `node tools/hosting-check.mjs`. Every request in it uses Node.js's default certificate validation. TLS checks were never disabled.

## Before and after

| | URL | Actual check (normal certificate validation) |
| --- | --- | --- |
| Genesis VISIT, before this job | `https://pip-squeekchain-hamster-com-576c.identitymd.eth.limo/` | **Fails before HTTP:** `EPROTO`, TLS alert 80 `internal_error`, over both IPv4 and IPv6 |
| Genesis VISIT, after this job | Unchanged (same URL) | Still fails. This job cannot change it (see blocker) |
| Verified working platform URL (same project, same CID) | `https://pip-squeekchain-hamster-com-576c.imd.site/` | HTTP 200, certificate `*.imd.site` from Let's Encrypt, `x-ipfs-cid: bafybeieud3pf6x2egb5yqzygp2pykn7spkrpmudszfjmk3jbinh2x7qozi`. `/source/`, `/observatory/`, `/overlay/`, `favicon.svg`, `share.png` and the production entry bundle also return 200 |
| Owner's final deployment (read only, not modified) | `https://hamster.imdember.com/`, `https://hamster.imdember.com/source/` | HTTP 200, certificate `hamster.imdember.com` from Let's Encrypt |

## Diagnosis

1. **What Genesis exposes.** VISIT renders the project's `demoUrl`, and only when the project is not removed and attribution is verified (Genesis bundle `shelf-project-*.js`). For an IMD-origin project, `demoUrl` is set only by IMD import or **Refresh from IMD**. The owner edit API (`PUT /code/projects/:id`) accepts only `name`, `integration`, `repoUrl` and `cover`, so there is no destination-URL field, as observed. The project record itself requires the owner's login, so this job read Genesis only through its public bundle.
2. **What IMD gives Genesis.** `GET https://api.imd.fun/jobs/576cf8e4-…` (and `api-imd.up.railway.app`, plus `GET /sites/9e3febf1-ac66-4c41-bb9a-c7f60ef1aeb2`) still returns `site.url = "https://pip-squeekchain-hamster-com-576c.identitymd.eth.limo"`, with status `named`. That is why a refresh "succeeds" but keeps the eth.limo URL: Genesis faithfully re-imports the value IMD publishes.
3. **The two-URL discrepancy.** The IMD explorer job page (`explorer.imd.fun/jobs/576cf8e4-…`) displays `https://pip-squeekchain-hamster-com-576c.imd.site/` in its Hosted and Published · Site rows, but the API record integrations consume was never changed. Both names front the same content: the on-chain ENS contenthash of `pip-squeekchain-hamster-com-576c.identitymd.eth` decodes to `bafybeieud3pf6x2egb5yqzygp2pykn7spkrpmudszfjmk3jbinh2x7qozi`. The resolver is `0xF29100983E058B709F3D539b0c765937B804AC15`, and the naming transaction is `0x0280…0283`, which succeeded in block 26,313,212. That CID is the one imd.site serves.
4. **Why eth.limo fails.** ENS resolution is correct, so the failure is on the gateway's TLS edge. eth.limo aborts the handshake with alert 80 for **every** `*.identitymd.eth.limo` name tried. That includes other IMD sites (`fantasy-hamster`, `hamlock-…`, `race-squeektoshi-…`, `squeek-wheel-oracle-…`) and a nonexistent subname. Meanwhile `app.ens.eth.limo`, a second-level name under another parent, gets its own certificate and returns 200. This is a platform-wide fault for `identitymd.eth` subnames on eth.limo, not something specific to this project.
5. **Why no in-page fix applies.** The failure happens during the TLS handshake, before any HTML is delivered. A JavaScript, meta or `_headers` redirect inside the export can never run there. No such change was made, and none would fix it.

## Supported controls examined

- **This job's delivery:** only the committed repository and `dist/`. The plane pins and names the export after the job completes. Workers must not run publishing commands, and no control sets `site.url` or a custom domain.
- **IMD public API (`/openapi.json`):** only paid request actions (`job.open`, `job.continue`, `launch.open`, …). There is no site-URL or custom-domain route. Creating one more paid job would be an extra fee and was not done.
- **IMD docs, "Your own domain":** the owner points their own ENS name or DNS (DNSLink) at the CID. That is an owner DNS action, outside this job's permissions, and it would still not change the Genesis `demoUrl`.
- **Genesis:** an IMD-origin project has no URL field. A direct "website" submission accepts a URL, but that would create a replacement project, which is forbidden and was not done.

So `https://hamster.imdember.com/` cannot be made the canonical destination through any supported control available to this job.

## Blocker and responsible components

1. **IMD control plane, site record (`api.imd.fun` `site.url` on `/jobs/:id` and `/sites/:id`).** It still emits `https://<label>.identitymd.eth.limo` while the explorer advertises `https://<label>.imd.site/`. **Needed:** publish the working `https://pip-squeekchain-hamster-com-576c.imd.site/` (or a supported author URL) in the record Genesis imports. Then the owner runs **Refresh from IMD** on the existing Genesis project.
2. **Genesis backend (squeekchain.com code projects, IMD import/refresh).** `demoUrl` comes only from IMD, and owners cannot override it. If Genesis should prefer the author-hosted `https://hamster.imdember.com/`, that needs a Genesis-side field or an admin change on project `80ca88da-35d6-4976-96d1-ce849eaa03fe`. This job cannot verify that the refresh overwrites `demoUrl`, because the record requires the owner's login.
3. **eth.limo gateway TLS for `*.identitymd.eth.limo`.** If its operator restores certificate issuance for `identitymd.eth` subnames, the existing VISIT URL starts working with no change elsewhere. Check this by re-running `node tools/hosting-check.mjs`.

After any of these platform changes, acceptance is: `node tools/hosting-check.mjs` reports `site.url` on the working host, and the Genesis VISIT target returns 200 with `tlsAuthorized: true`.

## Preserved and not touched

- The paid-job attribution is unchanged: job `576cf8e4-…`, paid by `0x9f2c…d985`. The existing Genesis review record is unchanged. No replacement project, duplicate submission, transaction or purchase was made, and no paid API was used. There was no fee beyond this continuation.
- Game source, assets, saves and features are unchanged. The committed `dist/` is byte-identical to the accepted export, so it keeps the same CID content.
- The owner's VPS, DNS, `hamster.imdember.com` deployment, IMD EMBER WORLD, other projects, wallets and private files were not accessed or modified. Only public HTTPS pages and APIs and public Ethereum RPC were read.
