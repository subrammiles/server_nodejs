import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { once } from 'node:events';

const run = promisify(execFile);
const cli = join(import.meta.dirname, 'todo-cli.js');

describe('todo-cli', () => {
  let env;

  beforeEach(async () => {
    env = { ...process.env, TODO_FILE: join(await mkdtemp(join(tmpdir(), 'todo-')), 'todos.json') };
  });

  it('adds and lists todos, reading config from an env var', async () => {
    await run('node', [cli, 'add', 'Learn', 'streams', '--priority', 'high'], { env });
    await run('node', [cli, 'add', 'Rest'], { env });
    const { stdout } = await run('node', [cli, 'list'], { env });
    assert.equal(stdout, '1. [high] Learn streams\n2. [normal] Rest\n');
  });

  it('supports machine-readable JSON output', async () => {
    await run('node', [cli, 'add', 'x', '-p', 'high'], { env });
    const { stdout } = await run('node', [cli, 'list', '--json'], { env });
    assert.deepEqual(JSON.parse(stdout), [{ title: 'x', priority: 'high' }]);
  });

  it('reads from stdin with "-"', async () => {
    const child = spawn('node', [cli, 'add', '-'], { env });
    child.stdin.end('Buy milk\n');
    const [code] = await once(child, 'close');
    assert.equal(code, 0);
    const { stdout } = await run('node', [cli, 'list'], { env });
    assert.match(stdout, /Buy milk/);
  });

  it('reports errors on stderr with a non-zero exit code', async () => {
    await assert.rejects(run('node', [cli, 'explode'], { env }), (err) => {
      assert.equal(err.code, 1);
      assert.match(err.stderr, /unknown command/);
      return true;
    });
  });

  it('loads variables with --env-file', async () => {
    const envFile = join(tmpdir(), `todo-${process.pid}.env`);
    const { writeFile } = await import('node:fs/promises');
    await writeFile(envFile, `TODO_FILE=${env.TODO_FILE}\n`);
    const { TODO_FILE, ...withoutVar } = env;
    await run('node', [`--env-file=${envFile}`, cli, 'add', 'from env file'], { env: withoutVar });
    const { stdout } = await run('node', [cli, 'list'], { env });
    assert.match(stdout, /from env file/);
  });
});
