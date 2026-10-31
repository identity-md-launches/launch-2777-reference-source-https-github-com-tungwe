// Reproduce the reopened findings against dist, then verify the same paths after rebuilding.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {serve} from './serve.mjs';
import {CHAINS} from '../dist/chain-config.mjs';
const require = createRequire(process.env.SQUEEK_TOOLS_PACKAGE || new URL('../package.json', import.meta.url));
const {chromium} = require('playwright');
const reproduce = process.argv.includes('--reproduce');
const folder = `test/scratch/revision/${reproduce ? 'before' : 'after'}`;
await mkdir(folder, {recursive: true});
const result = {at: new Date().toISOString(), mode: reproduce ? 'reproduction' : 'regression', checks: [], errors: []};
const {server, url} = await serve();
let browser;
function check(name, passed, evidence) {
  result.checks.push({name, passed, evidence});
  console.log(passed ? 'PASS' : 'REPRODUCED', name, JSON.stringify(evidence));
  if (!reproduce) assert.ok(passed, name);
}
try {
  browser = await chromium.launch({headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader']});
  const context = await browser.newContext({viewport: {width: 390, height: 844}});
  // Keep telemetry deterministically unavailable, and record real observer batches.
  await context.route('https://**/*', route => route.abort());
  await context.addInitScript(() => {
    const Original = window.IntersectionObserver;
    window.__visibilityBatches = [];
    window.IntersectionObserver = class extends Original {
      constructor(callback, options) {
        super((entries, observer) => {
          window.__visibilityBatches.push(entries.map(e => ({visible: e.isIntersecting, top: e.boundingClientRect.top})));
          callback(entries, observer);
        }, options);
        window.__emitPetVisibility = values => {
          const target = document.querySelector('.pet-canvas');
          callback(values.map(isIntersecting => ({target, isIntersecting})), this);
        };
      }
    };
  });
  const page = await context.newPage();
  page.on('pageerror', e => result.errors.push(e.message));
  await page.goto(url);
  await page.locator('#companion[data-model-status="ready"]').waitFor();
  const readings = [];
  for (const width of [390, 1440]) {
    await page.setViewportSize({width, height: width === 390 ? 844 : 900});
    await page.waitForTimeout(200);
    const evidence = await page.evaluate(() => ({
      width: innerWidth, speech: document.querySelector('#speech').textContent,
      reading: document.querySelector('#reading').textContent,
      foodBottom: document.querySelector('.food-tray').getBoundingClientRect().bottom
    }));
    readings.push(evidence);
    await page.screenshot({path: `${folder}/first-${width}.jpg`, type: 'jpeg', quality: 75});
  }
  check('Unavailable wheel message appears once and food fits 390', readings.every(r => r.reading === '') && readings[0].foodBottom <= 844, readings);
  await page.setViewportSize({width: 390, height: 844});
  await page.locator('.rehearsal-gallery summary').click();
  const sequence = [];
  for (let i = 0; i < 12; i++) {
    await page.locator(`[data-variant="${i}"]`).click();
    await page.waitForTimeout(500);
    sequence.push({requested: i, actual: await page.locator('#companion').getAttribute('data-chain-variant')});
  }
  const batches = await page.evaluate(() => window.__visibilityBatches);
  check('Twelve scroll-to-Pip selections start their matching gestures', sequence.every(s => s.actual === String(s.requested)), {sequence, batches});
  // The browser may schedule entries separately. Exercise the exact documented batch as well.
  await page.evaluate(() => window.__emitPetVisibility([false, true]));
  await page.locator('[data-variant="2"]').evaluate(button => button.click());
  await page.waitForTimeout(250);
  const batched = await page.locator('#companion').getAttribute('data-chain-variant');
  check('Final visible entry in an offscreen/onscreen batch resumes the renderer', batched === '2', {requested: '2', actual: batched});
  if (reproduce) await page.evaluate(() => window.__emitPetVisibility([true]));
  await page.waitForTimeout(4000);
  check('Resumed gesture finishes normally', await page.locator('#companion').getAttribute('data-chain-variant') === '', {variant: await page.locator('#companion').getAttribute('data-chain-variant')});
  if (!reproduce) {
    await page.evaluate(() => window.__emitPetVisibility([true, false]));
    await page.locator('[data-variant="4"]').evaluate(button => button.click());
    await page.waitForTimeout(250);
    assert.equal(await page.locator('#companion').getAttribute('data-chain-variant'), '');
    await page.evaluate(() => window.__emitPetVisibility([false, true]));
    await page.waitForTimeout(200);
    assert.equal(await page.locator('#companion').getAttribute('data-chain-variant'), '4');
    check('Final offscreen entry still pauses; returning onscreen resumes pending work', true);
  }
  await context.close();

  // Isolate the production chain UI from the automatic renderer so history is deterministic.
  const harness = await browser.newContext({viewport: {width: 390, height: 844}});
  await harness.route('https://**/*', route => route.abort());
  await harness.route(url + 'revision-harness.html', route => route.fulfill({contentType: 'text/html', body: '<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="stylesheet" href="./upgrade.css"></head><body><div class="studio-grid"><div id="companion"><div class="pet-scene"></div></div></div></body></html>'}));
  const historyPage = await harness.newPage();
  historyPage.on('pageerror', e => result.errors.push(e.message));
  await historyPage.goto(url + 'revision-harness.html');
  const rawLogs = {};
  for (const source of ['imd', 'squeek']) {
    const fixture = JSON.parse(await readFile(`test/fixtures/${source}-receipt.json`, 'utf8'));
    rawLogs[source] = fixture.receipt.logs.find(l => l.address.toLowerCase() === CHAINS[source].address.toLowerCase());
  }
  const history = await historyPage.evaluate(async ({url, rawLogs}) => {
    const {initChainUI} = await import(url + 'chain-ui.mjs');
    const {decodeLog} = await import(url + 'chain-protocol.mjs');
    const {CHAINS} = await import(url + 'chain-config.mjs');
    const {CAPTIONS} = await import(url + 'chain-expression.mjs');
    let language = 'en';
    const ui = initChainUI({getLanguage: () => language, getState: () => ({pet: {life: {energy: 100}}}), getNow: Date.now});
    const rows = [];
    for (const family of ['curious', 'pleased', 'celebrate']) {
      // The positive completed-block delta is a synthetic UI case, never live evidence.
      const source = family === 'curious' ? 'imd' : 'squeek';
      const real = decodeLog(CHAINS[source], CHAINS[source].chainId, rawLogs[source]);
      const event = {...real,
        type: family === 'curious' ? 'request' : 'settlement', completedBlocks: family === 'celebrate' ? '2' : '0',
        status: 'confirmed', played: false, confirmedAt: new Date().toISOString()};
      ui.director.cancel(); ui.director.seed = 20261031; ui.director.previous = {}; ui.director.choose(family);
      ui.queue.last = -Infinity; ui.queue.items = [];
      for (const monitor of Object.values(ui.monitors)) monitor.data.history = [];
      ui.monitors[source].data.history = [event];
      ui.queue.push(event);
      ui.frame(performance.now(), {}, 'baby');
      const variant = ui.director.active.index;
      for (const locale of ['en', 'zh-Hant']) {
        language = locale; ui.localize();
        const caption = CAPTIONS[variant][locale === 'en' ? 0 : 1];
        const initial = document.querySelector('.chain-card').textContent;
        document.querySelector('.chain-close').click();
        document.querySelector('.history-open').click();
        const reopened = document.querySelector('.chain-card').textContent;
        const saved = JSON.parse(localStorage.getItem('pip-chain-v1-' + source)).history[0];
        rows.push({family, locale, variant, initial, reopened, savedVariant: saved.variant,
          retained: initial.includes(caption) && reopened.includes(caption)});
      }
      // No played motion (including saves made before variant persistence) must stay neutral.
      ui.director.cancel(); delete event.variant;
      for (const played of [false, true]) {
        event.played = played; ui.monitors[source].emit();
        for (const locale of ['en', 'zh-Hant']) {
          language = locale; ui.localize(); document.querySelector('.history-open').click();
          const text = document.querySelector('.chain-card').textContent;
          rows.push({family, locale, observedOnly: true, legacyPlayed: played, text, neutral: !CAPTIONS.some(c => text.includes(c[locale === 'en' ? 0 : 1]))});
        }
      }
    }
    ui.dispose();
    return rows;
  }, {url, rawLogs});
  check('History retains the actual gesture in all three families and both languages', history.filter(r => !r.observedOnly).every(r => r.retained), history.filter(r => !r.observedOnly));
  check('Observed-only history never invents a played gesture', history.filter(r => r.observedOnly).every(r => r.neutral), history.filter(r => r.observedOnly));
  await harness.close();
  assert.deepEqual(result.errors, []);
} catch (e) {
  result.error = e.stack;
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser?.close(); server.close();
  await writeFile(`${folder}/results.json`, JSON.stringify(result, null, 2) + '\n');
}
