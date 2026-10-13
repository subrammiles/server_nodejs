// Run: node 01-modules/main.js
import { readFile } from 'node:fs/promises';   // "node:" prefix = built-in module
import multiply, { add, circleArea, PI } from './math.js';   // relative imports need the extension
import * as math from './math.js';            // namespace import
import legacy from './legacy.cjs';            // ESM can import CommonJS (module.exports becomes the default export)
import config from './config.json' with { type: 'json' };   // JSON import (import attributes)

console.log('add(2, 3)        =', add(2, 3));
console.log('multiply(2, 3)   =', multiply(2, 3));
console.log('circleArea(1)    =', circleArea(1), '(PI =', PI + ')');
console.log('math namespace   =', Object.keys(math));
console.log('CommonJS module  =', legacy.shout(legacy.greeting));
console.log('JSON config      =', config);

// __dirname / __filename do not exist in ESM. Use import.meta instead:
console.log('this file        =', import.meta.filename);
console.log('this folder      =', import.meta.dirname);

// Top-level await: allowed in ESM
const text = await readFile(new URL('./config.json', import.meta.url), 'utf8');
console.log('read with await  =', text.trim().length, 'chars');

// Dynamic import: load a module only when needed (lazy loading, optional features)
const { default: os } = await import('node:os');
console.log('loaded lazily    = node:os, platform', os.platform());

// Is this file the program's entry point? (ESM's version of require.main === module)
if (import.meta.main ?? process.argv[1] === import.meta.filename) {
  console.log('main.js was run directly');
}
