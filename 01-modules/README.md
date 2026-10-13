# 01: Modules (ESM and CommonJS)

Every Node file is a **module** with its own scope. You share code by exporting and importing.

| | ES Modules (ESM) | CommonJS (CJS) |
|---|---|---|
| Syntax | `import` / `export` | `require()` / `module.exports` |
| Status | the JavaScript standard, **use it for new code** | legacy, still common in older packages |
| Enabled by | `"type": "module"` in package.json, or `.mjs` | default without `"type"`, or `.cjs` |
| Loading | asynchronous, supports top-level `await` | synchronous |
| File path | `import.meta.filename`, `import.meta.dirname` | `__filename`, `__dirname` |

## Concepts
- Named exports, default export, namespace import (`import * as math`).
- **Relative imports need the file extension** in ESM (`./math.js`).
- **`node:` prefix** for built-ins (`node:fs`, `node:path`). It's clear and can't be shadowed by an npm package.
- Interop: ESM can `import` CJS. Since Node 22.12, CJS can also `require()` ESM.
- JSON imports with `with { type: 'json' }`.
- **Dynamic `import()`** for lazy or optional loading.
- **Top-level `await`**.
- Packages: `npm install x` puts code in `node_modules`, recorded in `package.json` (and `package-lock.json`).
  A package's `"exports"` field controls what can be imported from it.

## Run
```bash
node 01-modules/main.js
node --test "01-modules/*.test.js"
```
