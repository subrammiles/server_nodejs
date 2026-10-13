// CLUSTER: run one Node process per CPU core, all sharing the same port.
// The primary process only manages workers; the OS/primary spreads connections between them.
// Run: node 11-concurrency/cluster.js   then: curl localhost:3000 (repeat: different pids answer)
import cluster from 'node:cluster';
import { createServer } from 'node:http';
import { availableParallelism } from 'node:os';

const workers = Number(process.env.WORKERS ?? availableParallelism());
const port = Number(process.env.PORT ?? 3000);

if (cluster.isPrimary) {
  console.log(`primary ${process.pid} starting ${workers} workers`);
  for (let i = 0; i < workers; i++) cluster.fork();

  cluster.on('exit', (worker, code) => {
    console.log(`worker ${worker.process.pid} died (code ${code}), starting a replacement`);
    cluster.fork();   // self-healing
  });
  process.on('SIGTERM', () => {
    cluster.removeAllListeners('exit');
    for (const w of Object.values(cluster.workers)) w.kill();
    process.exit(0);
  });
} else {
  createServer((req, res) => res.end(`handled by worker ${process.pid}\n`))
    .listen(port, () => console.log(`worker ${process.pid} listening on ${port}`));
}
