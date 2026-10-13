// Test doubles with node:test's built-in mock API.
//   mock.fn()     a fake function that records calls       ("spy" / "stub" in sinon, jest.fn() in Jest)
//   mock.method() replaces a method on an existing object, restorable
//   mock.timers   fake Date and setTimeout: control time without waiting
import { afterEach, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { WeatherService, notifier } from './weather-service.js';

afterEach(() => mock.restoreAll());   // undo mock.method replacements after every test

describe('WeatherService', () => {
  it('calls the injected HTTP function and returns the temperature', async () => {
    const fetchJson = mock.fn(async () => ({ tempC: 31 }));   // STUB: canned answer, no network
    const service = new WeatherService({ fetchJson });

    assert.equal(await service.temperature('Hyderabad'), 31);
    assert.equal(fetchJson.mock.callCount(), 1);
    assert.match(fetchJson.mock.calls[0].arguments[0], /city=Hyderabad/);
  });

  it('caches results until the TTL expires (fake clock)', async () => {
    let now = 0;
    const fetchJson = mock.fn(async () => ({ tempC: 25 }));
    const service = new WeatherService({ fetchJson, cacheTtlMs: 1000, now: () => now });

    await service.temperature('Pune');
    now = 999;
    await service.temperature('Pune');
    assert.equal(fetchJson.mock.callCount(), 1);   // served from cache

    now = 1000;
    await service.temperature('Pune');
    assert.equal(fetchJson.mock.callCount(), 2);   // expired: fetched again
  });

  it('surfaces bad upstream data and network failures', async () => {
    const bad = new WeatherService({ fetchJson: async () => ({ temp: 'hot' }) });
    await assert.rejects(bad.temperature('X'), /Bad weather data/);

    const down = new WeatherService({ fetchJson: mock.fn(async () => { throw new Error('ECONNREFUSED'); }) });
    await assert.rejects(down.temperature('X'), /ECONNREFUSED/);
  });
});

describe('notifier', () => {
  it('mock.method replaces a real method (no SMS is sent) and records the call', () => {
    const send = mock.method(notifier, 'send', () => {});
    notifier.alertIfHot('subbu', 45);
    notifier.alertIfHot('subbu', 30);
    assert.equal(send.mock.callCount(), 1);
    assert.deepEqual(send.mock.calls[0].arguments, ['subbu', 'Heat alert: 45°C']);
  });
});

describe('fake timers', () => {
  it('advance time instantly instead of waiting', () => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'], now: new Date('2026-01-01T00:00:00Z') });
    try {
      const fired = mock.fn();
      setTimeout(fired, 60_000);
      mock.timers.tick(59_999);
      assert.equal(fired.mock.callCount(), 0);
      mock.timers.tick(1);
      assert.equal(fired.mock.callCount(), 1);
      assert.equal(new Date().toISOString(), '2026-01-01T00:01:00.000Z');
    } finally {
      mock.timers.reset();
    }
  });
});
