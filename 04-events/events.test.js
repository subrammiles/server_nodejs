import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { once, on } from 'node:events';
import { OrderService, TinyEmitter } from './order-events.js';

describe('EventEmitter', () => {
  it('calls every listener synchronously, in order', () => {
    const orders = new OrderService();
    const calls = [];
    orders.on('placed', (o) => calls.push(`a${o.id}`));
    orders.on('placed', (o) => calls.push(`b${o.id}`));
    orders.place('x', 1);
    calls.push('after');
    assert.deepEqual(calls, ['a1', 'b1', 'after']);
  });

  it('once() listeners run a single time', () => {
    const orders = new OrderService();
    const listener = mock.fn();
    orders.once('placed', listener);
    orders.place('x', 1);
    orders.place('y', 2);
    assert.equal(listener.mock.callCount(), 1);
  });

  it('an unhandled "error" event throws', () => {
    assert.throws(() => new OrderService().place('x', -1), /Invalid amount/);
  });

  it('a handled "error" event does not throw', () => {
    const orders = new OrderService();
    const onError = mock.fn();
    orders.on('error', onError);
    assert.equal(orders.place('x', 0), null);
    assert.equal(onError.mock.calls[0].arguments[0].message, 'Invalid amount 0');
  });

  it('events.once() and events.on() turn events into promises / async iterators', async () => {
    const orders = new OrderService();
    setImmediate(() => orders.place('x', 5));
    const [first] = await once(orders, 'placed');
    assert.equal(first.amount, 5);

    const ac = new AbortController();
    setImmediate(() => { orders.place('a', 1); orders.place('b', 2); });
    const seen = [];
    try {
      for await (const [order] of on(orders, 'placed', { signal: ac.signal })) {
        seen.push(order.customer);
        if (seen.length === 2) ac.abort();
      }
    } catch (e) {
      assert.equal(e.name, 'AbortError');
    }
    assert.deepEqual(seen, ['a', 'b']);
  });
});

describe('TinyEmitter (hand-written)', () => {
  it('supports on, off and emit', () => {
    const emitter = new TinyEmitter();
    const hi = mock.fn();
    emitter.on('greet', hi);
    assert.equal(emitter.emit('greet', 'Subbu'), true);
    emitter.off('greet', hi);
    assert.equal(emitter.emit('greet'), false);
    assert.deepEqual(hi.mock.calls.map((c) => c.arguments), [['Subbu']]);
  });
});
