import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { gunzipSync } from 'node:zlib';
import { createGzip } from 'node:zlib';
import { csvToObjects, splitLines, upperCase } from './transforms.js';

async function collect(stream) {
  const out = [];
  for await (const chunk of stream) out.push(chunk);
  return out;
}

describe('Buffer', () => {
  it('converts between encodings', () => {
    const b = Buffer.from('hi');
    assert.equal(b.toString('hex'), '6869');
    assert.equal(Buffer.from('aGk=', 'base64').toString(), 'hi');
    assert.equal(Buffer.byteLength('é'), 2);
  });
});

describe('transforms', () => {
  it('upperCase', async () => {
    const out = await collect(Readable.from(['ab', 'c']).pipe(upperCase()));
    assert.equal(out.join(''), 'ABC');
  });

  it('splitLines handles lines cut across chunks', async () => {
    const out = await collect(Readable.from(['li', 'ne1\nline', '2\nlast']).pipe(splitLines()));
    assert.deepEqual(out, ['line1', 'line2', 'last']);
  });

  it('csvToObjects', async () => {
    const out = await collect(Readable.from(['name,age\nA,1\nB,2\n']).pipe(splitLines()).pipe(csvToObjects()));
    assert.deepEqual(out, [{ name: 'A', age: '1' }, { name: 'B', age: '2' }]);
  });
});

describe('pipeline', () => {
  it('gzip round trip', async () => {
    const chunks = [];
    await pipeline(Readable.from(['hello '.repeat(100)]), createGzip(), new Writable({
      write(chunk, enc, cb) { chunks.push(chunk); cb(); },
    }));
    const zipped = Buffer.concat(chunks);
    assert.ok(zipped.length < 600);
    assert.equal(gunzipSync(zipped).toString(), 'hello '.repeat(100));
  });

  it('rejects and destroys all streams when one fails', async () => {
    const failing = new Writable({ write(chunk, enc, cb) { cb(new Error('disk full')); } });
    const source = Readable.from(['x']);
    await assert.rejects(pipeline(source, failing), /disk full/);
    assert.equal(source.destroyed, true);
  });
});
