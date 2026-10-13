// Run: node 07-process-and-cli/process-info.js one two --flag
// Then press Ctrl+C to see graceful shutdown.
import os from 'node:os';

console.log('pid         ', process.pid);
console.log('argv        ', process.argv);
console.log('node        ', process.version, 'on', process.platform, process.arch);
console.log('cwd         ', process.cwd());
console.log('NODE_ENV    ', process.env.NODE_ENV ?? '(not set)');
console.log('memory      ', Math.round(process.memoryUsage().rss / 1e6), 'MB RSS');
console.log('uptime      ', process.uptime().toFixed(2), 's');
console.log('os          ', os.type(), os.release(), '|', os.cpus().length, 'CPUs |', Math.round(os.totalmem() / 1e9), 'GB RAM');

// SIGNALS: Ctrl+C sends SIGINT; Docker/Kubernetes send SIGTERM before killing the process.
// Handle them to finish work and close connections cleanly (see lesson 21).
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log(`\nreceived ${signal}: cleaning up...`);
    clearInterval(timer);
    process.exitCode = 0;   // let the event loop empty and exit naturally
  });
}

process.on('exit', (code) => console.log(`exit with code ${code} (only synchronous code runs here)`));

// Last-resort safety nets: log, then exit. The process is in an unknown state.
process.on('uncaughtException', (err) => {
  console.error('uncaught exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('unhandled rejection:', reason);
  process.exit(1);
});

const timer = setInterval(() => console.log('working... (Ctrl+C to stop)'), 1000);
