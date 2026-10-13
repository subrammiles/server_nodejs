// Run: node 06-streams/demo.js
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdtemp, stat, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGunzip, createGzip } from 'node:zlib';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { csvToObjects, splitLines, upperCase } from './transforms.js';

console.log('--- Buffer: raw bytes ---');
const buf = Buffer.from('Hello, Node!', 'utf8');
console.log(buf, '| hex:', buf.toString('hex'), '| base64:', buf.toString('base64'), '| bytes:', buf.length);
console.log('multi-byte characters: "నమస్తే" is', Buffer.byteLength('నమస్తే'), 'bytes but', 'నమస్తే'.length, 'JS chars');

const dir = await mkdtemp(join(tmpdir(), 'streams-'));
const big = join(dir, 'big.txt');
await writeFile(big, Array.from({ length: 100_000 }, (_, i) => `line ${i} some repeated text`).join('\n'));

console.log('\n--- pipeline: file -> gzip -> file, then back ---');
// pipeline() connects streams, handles backpressure, and cleans up ALL of them on error
await pipeline(createReadStream(big), createGzip(), createWriteStream(big + '.gz'));
await pipeline(createReadStream(big + '.gz'), createGunzip(), createWriteStream(big + '.copy'));
console.log('original', (await stat(big)).size, 'bytes, gzipped', (await stat(big + '.gz')).size, 'bytes, restored', (await stat(big + '.copy')).size);

console.log('\n--- readline: count lines without loading the file ---');
let count = 0;
for await (const line of createInterface({ input: createReadStream(big) })) {
  if (line) count++;
}
console.log('lines:', count);

console.log('\n--- custom transforms + async iteration ---');
const csv = 'name,city\nAsha,Hyderabad\nRavi,Bengaluru\n';
for await (const row of Readable.from([csv]).pipe(splitLines()).pipe(csvToObjects())) {
  console.log(row);
}
await pipeline(Readable.from(['streams ', 'are ', 'composable\n']), upperCase(), process.stdout);
