// The BUILT-IN test runner (node:test): no dependencies needed.
import { after, before, beforeEach, describe, it, test } from 'node:test';
import assert from 'node:assert/strict';
import { Cart } from './cart.js';

describe('Cart', () => {
  let cart;

  before(() => { /* runs once before all tests in this describe, e.g. start a test DB */ });
  beforeEach(() => { cart = new Cart(); });   // fresh object per test: tests never depend on each other
  after(() => { /* runs once at the end, e.g. close connections */ });

  it('starts empty', () => {
    assert.deepEqual(cart.items, []);
    assert.equal(cart.total(), 0);
  });

  it('adds quantities of the same sku together', () => {
    cart.add('pen', 10, 2).add('pen', 10, 3);
    assert.deepEqual(cart.items, [{ sku: 'pen', price: 10, quantity: 5 }]);
  });

  describe('pricing', () => {
    // Table-driven tests: one test body, many cases
    const cases = [
      { name: 'below threshold: no discount', items: [['a', 999.99, 1]], expected: 999.99 },
      { name: 'exactly 1000: 10% off', items: [['a', 500, 2]], expected: 900 },
      { name: 'rounds to cents', items: [['a', 0.1, 3]], expected: 0.3 },
    ];
    for (const { name, items, expected } of cases) {
      it(name, () => {
        items.forEach(([sku, price, qty]) => cart.add(sku, price, qty));
        assert.equal(cart.total(), expected);
      });
    }
  });

  it('rejects invalid input with specific errors', () => {
    assert.throws(() => cart.add('x', 1, 0), RangeError);
    assert.throws(() => cart.add('x', 1, 1.5), { message: /positive integer/ });
    assert.throws(() => cart.add('x', -1), /negative/);
  });

  it.todo('supports coupon codes');                       // shows up as TODO in the report
  it.skip('applies regional tax', () => {});            // skipped, with a visible marker
});

test('assert cheat sheet', () => {
  assert.equal(1 + 1, 2);                               // strict ===
  assert.deepEqual({ a: [1] }, { a: [1] });             // structural equality
  assert.notDeepEqual({ a: 1 }, { a: '1' });
  assert.ok('truthy');
  assert.match('order-123', /^order-\d+$/);
  assert.partialDeepStrictEqual({ id: 1, name: 'x', extra: true }, { id: 1 });   // Node 24: compare a subset
});
