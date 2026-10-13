// Run: node 05-files/demo.js
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { NotesStore } from './notes-store.js';

console.log('--- path ---');
const file = '/var/app/uploads/report.final.pdf';
console.log({ dirname: path.dirname(file), basename: path.basename(file), extname: path.extname(file) });
console.log('join     ', path.join('uploads', '..', 'images', 'logo.png'));
console.log('resolve  ', path.resolve('images', 'logo.png'), '(relative to the CURRENT DIRECTORY)');
console.log('relative to THIS FILE:', path.join(import.meta.dirname, 'notes-store.js'));

console.log('\n--- fs/promises ---');
const store = await new NotesStore(path.join(tmpdir(), 'node-tutorial-notes')).init();
await store.save('shopping', 'milk, eggs');
await store.save('ideas', 'learn streams next');
console.log('notes    ', await store.list());
console.log('get      ', await store.get('shopping'));
console.log('missing  ', await store.get('nothing'));
console.log('size     ', await store.sizeOf('ideas'), 'bytes');
console.log('audit log\n' + readFileSync(path.join(store.directory, 'audit.log'), 'utf8'));

// Sync APIs (readFileSync) are fine at startup or in scripts, but NEVER inside request handlers (lesson 03).
