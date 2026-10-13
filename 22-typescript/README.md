# 22: TypeScript

TypeScript adds **static types** to JavaScript: many bugs (typos, `undefined` access, wrong arguments) are caught
**before** the code runs, and editors get accurate autocomplete. Most professional Node backends use it.

**Node 24 runs `.ts` files directly** (type stripping): `node 22-typescript/src/server.ts`. No build step is needed in
development. **Type checking** is a separate step: `npm run typecheck` (runs `tsc`, which emits no files).

## Concepts
- Type annotations, `interface` vs `type`, optional (`?`) and `readonly` properties.
- **Union and literal types** (`'beginner' | 'advanced'`), used instead of `enum`.
- **Utility types**: `Omit`, `Partial`, `Pick`, `Record`.
- **Generics**: `InMemoryStore<T extends { id: number }>`.
- **Narrowing and type guards** (`value is Level`), and `unknown` (safe) vs `any` (unsafe).
- **Discriminated unions** (`Result<T>`): make "success or failure" explicit, so the compiler forces callers to check.
- `strict` mode, `noUncheckedIndexedAccess`: the settings that catch the most bugs.
- `import type`: type-only imports are erased.
- Typing Express with `@types/express`: `Request<Params, ResBody, ReqBody, Query>`.
- **Types are erased at runtime**: data from HTTP, files or databases is still unchecked, so validate it
  (Zod infers TS types from schemas: `z.infer<typeof schema>`).
- `erasableSyntaxOnly`: Node strips only plain type syntax. `enum`, `namespace` and constructor parameter properties
  need a real compiler (`tsc` emit, `tsx`, esbuild...). This repo avoids them.

## Try it
Change `price: 10` to `price: '10'` in a test and run `npm run typecheck`: tsc reports the error, while plain Node
would happily run it.

## Run
```bash
node 22-typescript/src/server.ts
npm run typecheck
node --test "22-typescript/test/*.test.ts"
```
