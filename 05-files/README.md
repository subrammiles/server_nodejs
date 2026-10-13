# 05: Files and paths

## Concepts
- **`node:fs/promises`**: `readFile`, `writeFile`, `appendFile`, `readdir`, `stat`, `mkdir({ recursive })`, `rm({ force })`.
- **Sync vs async**: `readFileSync` blocks the event loop. It's OK in scripts and at startup, never in request handlers.
- **Errors carry a `code`**: `ENOENT` (not found), `EACCES` (permission), `EEXIST`... Handle the expected ones (`get` returns `null`).
- **`node:path`**: `join`, `resolve`, `dirname`, `basename`, `extname`. Never concatenate paths with `+`.
  `resolve('x')` is relative to the **current working directory**. Use `import.meta.dirname` for "next to this file".
- **Path traversal**: validate anything user-controlled before using it in a path (`notes-store.js` does).
- Large files: don't `readFile` 2 GB into memory. Stream it (lesson 06).
- Temporary folders: `mkdtemp(join(tmpdir(), 'prefix-'))`, used by the tests for isolation.
- Watching files: `fs.watch` (or tools like `node --watch` for development).

## Run
```bash
node 05-files/demo.js
node --test "05-files/*.test.js"
```
