// Knex configuration. The connection comes from an ENV VAR, never hard-coded
// (the old version of this repo had a database password committed in its knexfile).
export function knexConfig(connectionString = process.env.DATABASE_URL) {
  return {
    client: 'pg',
    connection: connectionString,
    pool: { min: 0, max: 10 },   // a POOL reuses connections instead of opening one per query
    migrations: { directory: new URL('./migrations', import.meta.url).pathname, loadExtensions: ['.js'] },
    seeds: { directory: new URL('./seeds', import.meta.url).pathname, loadExtensions: ['.js'] },
  };
}

// The knex CLI reads the default export:  npx knex --knexfile 16-postgres-knex/knexfile.js migrate:latest
export default knexConfig();
