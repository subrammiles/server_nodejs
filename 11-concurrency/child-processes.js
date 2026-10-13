// The four ways to start another program. Run: node 11-concurrency/child-processes.js
import { exec, execFile, fork, spawn } from 'node:child_process';
import { once } from 'node:events';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

// fork: run a Node module as a child process with an IPC channel
export async function sumInChildProcess(upTo) {
  const child = fork(new URL('./sum-child.js', import.meta.url));
  child.send({ upTo });
  const [message] = await once(child, 'message');
  return message.sum;
}

// spawn: streams stdout/stderr as they are produced (long-running or large output)
export async function spawnLines(command, args) {
  const child = spawn(command, args);
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk; });
  const [code] = await once(child, 'close');
  return { code, lines: output.trim().split('\n') };
}

if (import.meta.main ?? process.argv[1] === import.meta.filename) {
  // exec: runs through a SHELL, buffers all output. Convenient but NEVER pass user input (shell injection!)
  console.log('exec     :', (await execAsync('echo $SHELL && node --version')).stdout.trim().replace('\n', ' | '));

  // execFile: runs the program directly, no shell. Arguments are passed safely as an array
  console.log('execFile :', (await execFileAsync('node', ['-e', 'console.log(21 * 2)'])).stdout.trim());

  console.log('spawn    :', await spawnLines('node', ['-e', 'for (let i = 1; i <= 3; i++) console.log("line " + i)']));
  console.log('fork     : sum 1..1e8 =', await sumInChildProcess(1e8));
}
