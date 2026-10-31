// Read-only hosting diagnosis for the Genesis VISIT link of IMD job 576cf8e4-6e0c-4639-a0dd-09468cdc3d2e.
// Every HTTPS request uses Node's default certificate validation (rejectUnauthorized stays true).
// Usage: node tools/hosting-check.mjs [--out artifacts/hosting-check.json]
import https from 'node:https';
import {writeFile} from 'node:fs/promises';
import {namehash} from 'viem';

const JOB = '576cf8e4-6e0c-4639-a0dd-09468cdc3d2e';
const LABEL = 'pip-squeekchain-hamster-com-576c';
const ENS_NAME = `${LABEL}.identitymd.eth`;
const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const RPC = 'https://ethereum-rpc.publicnode.com';
const IMD_APIS = ['https://api.imd.fun', 'https://api-imd.up.railway.app'];
const TARGETS = [
  {role: 'Genesis VISIT today (IMD site.url)', url: `https://${LABEL}.identitymd.eth.limo/`},
  {role: 'Genesis VISIT today, IPv4 only', url: `https://${LABEL}.identitymd.eth.limo/`, family: 4},
  {role: 'Genesis VISIT today, IPv6 only', url: `https://${LABEL}.identitymd.eth.limo/`, family: 6},
  {role: 'Other identitymd.eth subname on eth.limo (control)', url: 'https://fantasy-hamster.identitymd.eth.limo/'},
  {role: 'Second-level ENS subname of another parent on eth.limo (control)', url: 'https://app.ens.eth.limo/'},
  {role: 'IMD explorer site link (platform gateway)', url: `https://${LABEL}.imd.site/`},
  {role: 'Platform gateway, source page', url: `https://${LABEL}.imd.site/source/`},
  {role: 'Platform gateway, production entry bundle', url: `https://${LABEL}.imd.site/assets/code/studio-PUQOYFUA.js`},
  {role: 'Owner final deployment (read only, unchanged)', url: 'https://hamster.imdember.com/'},
  {role: 'Owner public source (read only, unchanged)', url: 'https://hamster.imdember.com/source/'},
  {role: 'Genesis project page', url: 'https://squeekchain.com/genesis/code/80ca88da-35d6-4976-96d1-ce849eaa03fe'},
];

const outIndex = process.argv.indexOf('--out');
const out = outIndex > 0 ? process.argv[outIndex + 1] : 'artifacts/hosting-check.json';

function probe({url, family}) {
  return new Promise(resolve => {
    const started = Date.now();
    const req = https.get(url, {family, timeout: 20000, headers: {'user-agent': 'pip-hosting-check/1'}}, res => {
      const cert = res.socket.getPeerCertificate?.() || {};
      const tlsAuthorized = res.socket.authorized, remoteAddress = res.socket.remoteAddress;
      res.resume();
      res.on('end', () => resolve({
        ok: res.statusCode >= 200 && res.statusCode < 400 && tlsAuthorized === true,
        status: res.statusCode,
        tlsAuthorized,
        remoteAddress,
        certSubject: cert.subject?.CN ?? null,
        certIssuer: cert.issuer ? `${cert.issuer.O ?? ''} ${cert.issuer.CN ?? ''}`.trim() : null,
        certSubjectAltName: cert.subjectaltname ?? null,
        certValidTo: cert.valid_to ?? null,
        contentType: res.headers['content-type'] ?? null,
        ipfsCid: res.headers['x-ipfs-cid'] ?? null,
        location: res.headers.location ?? null,
        ms: Date.now() - started,
      }));
    });
    req.on('timeout', () => req.destroy(Object.assign(Error('timeout'), {code: 'ETIMEDOUT'})));
    req.on('error', error => resolve({ok: false, status: null, error: error.code ?? null, message: error.message.split('\n')[0], ms: Date.now() - started}));
  });
}

async function json(url) {
  const res = await fetch(url, {signal: AbortSignal.timeout(20000)});
  if (!res.ok) throw Error(`${url} HTTP ${res.status}`);
  return res.json();
}

async function ethCall(to, data) {
  const body = {jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{to, data}, 'latest']};
  const res = await fetch(RPC, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(body), signal: AbortSignal.timeout(20000)});
  const reply = await res.json();
  if (reply.error) throw Error(reply.error.message);
  return reply.result;
}

function contenthashToCid(hex) {
  // ENS contenthash 0xe301 + CIDv1 bytes -> base32 multibase "b..." CID.
  if (!hex.startsWith('0xe301')) return null;
  const bytes = Buffer.from(hex.slice(6), 'hex');
  const alphabet = 'abcdefghijklmnopqrstuvwxyz234567';
  let bits = 0, value = 0, text = 'b';
  for (const byte of bytes) {
    value = (value << 8) | byte; bits += 8;
    while (bits >= 5) { text += alphabet[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) text += alphabet[(value << (5 - bits)) & 31];
  return text;
}

async function ens() {
  const node = namehash(ENS_NAME).slice(2);
  const resolverWord = await ethCall(ENS_REGISTRY, '0x0178b8bf' + node); // resolver(bytes32)
  const resolver = '0x' + resolverWord.slice(-40);
  const raw = await ethCall(resolver, '0xbc1c58d1' + node); // contenthash(bytes32)
  const length = parseInt(raw.slice(66, 130), 16);
  const contenthash = '0x' + raw.slice(130, 130 + length * 2);
  return {name: ENS_NAME, rpc: RPC, resolver, contenthash, cid: contenthashToCid(contenthash)};
}

const report = {at: new Date().toISOString(), job: JOB, tlsValidation: 'Node.js default (rejectUnauthorized: true); no TLS checks disabled', imd: [], ens: null, targets: []};
for (const api of IMD_APIS) {
  try {
    const job = await json(`${api}/jobs/${JOB}`);
    report.imd.push({api, siteId: job.site?.id ?? null, siteUrl: job.site?.url ?? null, siteStatus: job.site?.status ?? null, cid: job.site?.cid ?? null, ensName: job.site?.ensName ?? null, namingTx: job.site?.txHash ?? null, paidBy: job.paidBy ?? null, repoUrl: job.delivery?.repoUrl ?? null});
  } catch (error) { report.imd.push({api, error: error.message}); }
}
try { report.ens = await ens(); } catch (error) { report.ens = {name: ENS_NAME, error: error.message}; }
for (const target of TARGETS) report.targets.push({...target, ...(await probe(target))});

await writeFile(out, JSON.stringify(report, null, 2) + '\n');
for (const t of report.targets) console.log(`${t.ok ? 'PASS' : 'FAIL'} ${String(t.status ?? t.error).padEnd(22)} ${t.url}${t.family ? ` (IPv${t.family})` : ''}  ${t.certSubject ? 'cert ' + t.certSubject : t.message ?? ''}`);
for (const i of report.imd) console.log(`IMD ${i.api}: site.url = ${i.siteUrl ?? i.error}`);
console.log(`ENS ${ENS_NAME}: ${report.ens.cid ?? report.ens.error}`);
console.log('Wrote', out);
