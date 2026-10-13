import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import multiply, { add, circleArea } from './math.js';
import legacy from './legacy.cjs';

test('named and default exports', () => {
  assert.equal(add(2, 3), 5);
  assert.equal(multiply(4, 5), 20);
  assert.equal(circleArea(2), 12.56636);
});

test('ESM imports CommonJS: module.exports becomes the default export', () => {
  assert.equal(legacy.shout('hi'), 'HI!');
});

test('CommonJS code can require() ESM modules (Node 22.12+)', () => {
  const require = createRequire(import.meta.url);
  const math = require('./math.js');
  assert.equal(math.add(1, 1), 2);
  assert.equal(math.default(2, 2), 4);
});

test('dynamic import returns a promise of the module namespace', async () => {
  const math = await import('./math.js');
  assert.deepEqual(Object.keys(math).sort(), ['PI', 'add', 'circleArea', 'default']);
});

test('import.meta replaces __dirname and __filename', () => {
  assert.ok(import.meta.filename.endsWith('modules.test.js'));
  assert.ok(import.meta.dirname.endsWith('01-modules'));
});
