#!/usr/bin/env node
// A real command-line tool using only built-ins.
//   node 07-process-and-cli/todo-cli.js add "Learn streams" --priority high
//   node 07-process-and-cli/todo-cli.js list --json
//   echo "Buy milk" | node 07-process-and-cli/todo-cli.js add -
//   node --env-file=07-process-and-cli/.env.example 07-process-and-cli/todo-cli.js list
import { parseArgs } from 'node:util';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { text } from 'node:stream/consumers';

// Configuration from ENVIRONMENT VARIABLES, with a default
const file = process.env.TODO_FILE ?? join(tmpdir(), 'todos.json');

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    priority: { type: 'string', short: 'p', default: 'normal' },
    json: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

async function load() {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

const [command, ...rest] = positionals;

if (values.help || !command) {
  console.log('Usage: todo-cli <add|list|clear> [text] [--priority high|normal] [--json]');
  process.exit(command ? 0 : 1);   // exit code 1 = error, so scripts can detect misuse
}

switch (command) {
  case 'add': {
    // "-" means "read the text from standard input" (pipes!)
    const title = rest[0] === '-' ? (await text(process.stdin)).trim() : rest.join(' ');
    if (!title) {
      console.error('error: nothing to add');   // errors go to STDERR, not stdout
      process.exitCode = 2;
      break;
    }
    const todos = await load();
    todos.push({ title, priority: values.priority });
    await writeFile(file, JSON.stringify(todos));
    console.log(`added: ${title} (${values.priority})`);
    break;
  }
  case 'list': {
    const todos = await load();
    if (values.json) {
      console.log(JSON.stringify(todos));   // machine-readable output for other programs
    } else {
      todos.forEach((t, i) => console.log(`${i + 1}. [${t.priority}] ${t.title}`));
      if (todos.length === 0) console.log('(nothing to do)');
    }
    break;
  }
  case 'clear':
    await writeFile(file, '[]');
    console.log('cleared');
    break;
  default:
    console.error(`error: unknown command "${command}"`);
    process.exitCode = 1;
}
