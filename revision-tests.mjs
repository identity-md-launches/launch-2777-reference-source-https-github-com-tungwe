import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ChainMonitor} from './dist/chain-monitor.mjs';
import {CHAINS} from './dist/chain-config.mjs';
import {decodeLog} from './dist/chain-protocol.mjs';

for (const [source, variants] of [['imd', [0, 1, 2]], ['squeek', [3, 4, 5, 6, 7, 8]]]) {
  test(`${source} history persists the selected motion through save/reload without changing provenance`, () => {
    const fixture = JSON.parse(readFileSync(`test/fixtures/${source}-receipt.json`));
    const raw = fixture.receipt.logs.find(l => l.address.toLowerCase() === CHAINS[source].address);
    const event = {...decodeLog(CHAINS[source], CHAINS[source].chainId, raw),
      confirmedAt: fixture.retrievedAt, completedBlocks: '0', played: false, status: 'confirmed'};
    const values = new Map();
    const storage = {getItem: k => values.get(k), setItem: (k, v) => values.set(k, v)};
    const monitor = new ChainMonitor(CHAINS[source], {storage});
    monitor.data.cursor = {number: event.blockNumber, hash: event.blockHash, units: '0', round: '0'};
    monitor.data.history = [event];
    for (const variant of variants) {
      monitor.markPlayed(event, variant);
      const restored = new ChainMonitor(CHAINS[source], {storage});
      assert.equal(restored.data.history.length, 1);
      assert.equal(restored.data.history[0].played, true);
      assert.equal(restored.data.history[0].variant, variant);
      assert.equal(restored.data.history[0].transactionHash, event.transactionHash);
      assert.equal(restored.data.history[0].completedBlocks, '0');
      assert.equal(restored.data.cursor.hash, event.blockHash);
    }
    // Existing saves need no migration and do not acquire an invented motion.
    delete event.variant; monitor.emit();
    const legacy = new ChainMonitor(CHAINS[source], {storage});
    assert.equal(legacy.data.history[0].played, true);
    assert.equal(legacy.data.history[0].variant, undefined);
  });
}
