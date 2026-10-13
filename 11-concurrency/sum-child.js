// A CHILD PROCESS started with fork(): a separate Node process with its own memory,
// talking to the parent over IPC messages. (Ported from the old fork example.)
process.on('message', ({ upTo }) => {
  let sum = 0;
  for (let i = 1; i <= upTo; i++) sum += i;
  process.send({ upTo, sum });
  process.exit(0);   // exit when done, or the child stays alive waiting for messages
});
