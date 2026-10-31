// Capture the production renderer; compose its original pixels into a contact sheet.
import {createRequire} from 'node:module';
import {writeFile, mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {serve} from './serve.mjs';
import {GALLERY, CAPTIONS} from '../dist/chain-expression.mjs';
const require = createRequire(process.env.SQUEEK_TOOLS_PACKAGE || new URL('../package.json', import.meta.url));
const {chromium} = require('playwright'), sharp = require('sharp');
const {server, url} = await serve();
const report = {
  at: new Date().toISOString(), kind: 'simulated-animation-rehearsal',
  viewport: {width: 520, height: 950}, stage: 'grown', expressiveness: 'lively',
  checks: [], careRewards: 'not-yet-checked',
  limitations: ['Controlled browser clock; frames at 0.60, 1.35 and 3.30 seconds after selection.',
    'A screenshot contact sheet is not video or a physical-device/frame-rate certification.',
    'Network reads are blocked in this simulated rehearsal.'],
};
await mkdir('test/scratch/gallery', {recursive: true});
await mkdir('artifacts', {recursive: true});
let browser;
try {
  browser = await chromium.launch({headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader']});
  const page = await browser.newPage({viewport: report.viewport});
  page.setDefaultTimeout(15000);
  await page.route('https://**/*', r => r.abort());
  await page.clock.install();
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 2000));
  await page.goto(url);
  await page.locator('#companion[data-model-status="ready"]').waitFor();
  await page.evaluate(() => {
    const key = 'squeek-public-pet-v1', data = JSON.parse(localStorage.getItem(key));
    data.xp = 10080;
    data.growth = {version: 2, settledAt: Date.now(), remainderMs: 0, legacyXp: 0};
    localStorage.setItem(key, JSON.stringify(data));
  });
  await page.reload();
  await page.locator('#companion[data-model-stage="grown"][data-model-status="ready"]').waitFor();
  await page.selectOption('#expressiveness', 'lively');
  await page.locator('.rehearsal-gallery summary').click();
  const care = () => page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('squeek-public-pet-v1'));
    return JSON.stringify({meals: data.meals, life: data.life});
  });
  const before = await care(), frames = [];
  for (let i = 0; i < 12; i++) {
    await page.locator(`[data-variant="${i}"]`).click();
    await page.clock.runFor(100);
    assert.equal(await page.locator('#companion').getAttribute('data-chain-variant'), String(i));
    let elapsed = 100;
    const captures = [];
    for (const sample of [600, 1350, 3300]) {
      await page.clock.runFor(sample - elapsed); elapsed = sample;
      const screenshot = await page.locator('.model-mount').screenshot({type: 'png', timeout: 10000});
      await writeFile(`test/scratch/gallery/variant-${i + 1}-${sample}.png`, screenshot);
      captures.push(screenshot);
    }
    frames.push(captures);
    const englishCard = await page.locator('.chain-card').innerText();
    assert.match(englishCard, /Simulated/);
    assert.ok(englishCard.includes(CAPTIONS[i][0]));
    assert.equal(await page.locator('.chain-card').getAttribute('data-source'), 'simulated');
    await page.selectOption('#language', 'zh-Hant');
    const chineseCard = await page.locator('.chain-card').innerText();
    assert.ok(chineseCard.includes(CAPTIONS[i][1]));
    assert.match(chineseCard, /模擬/);
    await page.selectOption('#language', 'en');
    await page.clock.runFor(600);
    assert.equal(await page.locator('#companion').getAttribute('data-chain-variant'), '');
    await page.clock.fastForward(8200);
    await page.clock.runFor(100);
    report.checks.push({index: i + 1, ...GALLERY[i], started: true, returnedToIdle: true,
      samplesAfterSelectionMs: [600, 1350, 3300], finishedCheckedAtMs: 3900, englishCard, chineseCard});
    console.log('PASS', i + 1, GALLERY[i].name, '— three poses, bilingual card, return to idle');
    await writeFile('test/scratch/gallery/results.json', JSON.stringify(report, null, 2) + '\n');
  }
  assert.equal(await care(), before);
  assert.deepEqual(await page.evaluate(() => ['imd', 'squeek'].map(s =>
    JSON.parse(localStorage.getItem('pip-chain-v1-' + s) || '{}').history || [])), [[], []]);
  report.careRewards = 'unchanged'; report.liveHistory = 'unchanged';
  await browser.close(); browser = null;

  // Center crops only; these are original renderer pixels, not pet illustrations.
  const width = 1500, height = 1224, margin = 24, gap = 18, cell = 472, rowHeight = 270;
  const xml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const svg = [`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#f8f4ed"/><g font-family="sans-serif" fill="#3e334d"><text x="24" y="40" font-size="28" font-weight="600">Pip's twelve little gestures</text><text x="24" y="68" font-size="16">Simulated rehearsal · actual production renderer · grown stage · lively · no care rewards or live history</text><text x="24" y="94" font-size="14">Within every tile, left to right: anticipation 0.60s · action 1.35s · settling 3.30s (controlled clock)</text>`];
  const layers = [];
  for (let i = 0; i < 12; i++) {
    const left = margin + (i % 3) * (cell + gap), top = 116 + Math.floor(i / 3) * rowHeight;
    svg.push(`<rect x="${left}" y="${top}" width="${cell}" height="252" rx="12" fill="#eee9f4"/><text x="${left + 12}" y="${top + 202}" font-size="18" font-weight="600">${i + 1}. ${xml(GALLERY[i].name)}</text><text x="${left + 12}" y="${top + 230}" font-size="16">${GALLERY[i].family} · ${GALLERY[i].zh}</text>`);
    for (let j = 0; j < 3; j++) {
      const metadata = await sharp(frames[i][j]).metadata();
      const side = Math.min(metadata.width, metadata.height);
      const input = await sharp(frames[i][j]).extract({left: Math.floor((metadata.width - side) / 2), top: 0, width: side, height: side}).resize(144, 168, {fit: 'contain', background: '#eee9f4'}).png().toBuffer();
      layers.push({input, left: left + 12 + j * 152, top: top + 12});
    }
  }
  svg.push('</g></svg>');
  await sharp(Buffer.from(svg.join(''))).composite(layers).jpeg({quality: 80}).toFile('artifacts/expression-gallery.jpg');
  report.gallery = 'artifacts/expression-gallery.jpg';
  await writeFile('artifacts/expression-results.json', JSON.stringify(report, null, 2) + '\n');
  console.log('PASS gallery written; all 12 gestures settle with unchanged care/history');
} catch (error) {
  report.error = error.stack; console.error(error); process.exitCode = 1;
} finally {
  await browser?.close(); server.close();
  await writeFile('test/scratch/gallery/results.json', JSON.stringify(report, null, 2) + '\n');
}
