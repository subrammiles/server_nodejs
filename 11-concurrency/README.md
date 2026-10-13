# 11: Using more than one CPU core

A single Node process runs JavaScript on one core (lesson 03). There are three ways to do more:

| Tool | What it is | Use for |
|---|---|---|
| **worker_threads** | extra threads in the same process, each with its own event loop, talking by messages | CPU-heavy work: image resizing, hashing, parsing, maths |
| **child_process** | another program or Node process | running tools (`git`, `ffmpeg`), isolating risky work |
| **cluster** | N copies of your server sharing one port | using all cores for request handling |

## Concepts
- `new Worker(file, { workerData })`, `postMessage` / `on('message')`. Threads share no variables (except `SharedArrayBuffer`).
- **Worker pool** (`WorkerPool`): starting threads is expensive, so reuse a fixed number and queue the tasks.
  In production use **piscina**.
- Child processes: `exec` (shell, buffered: **beware shell injection**), `execFile` (no shell, safe args),
  `spawn` (streams), `fork` (Node + IPC).
- `cluster`: the primary forks workers and restarts crashed ones. In containers you usually run **one process per
  container** and let Kubernetes or Docker scale replicas instead. PM2 is a common alternative on plain VMs.
- `os.availableParallelism()`: how many workers make sense.

## Run
```bash
node 11-concurrency/child-processes.js
node 11-concurrency/cluster.js               # curl localhost:3000 several times
node --test "11-concurrency/*.test.js"
```
