// UDP: connectionless datagrams. No delivery or ordering guarantees, very low overhead
// (DNS, metrics like StatsD, games, video). Run: node 09-networking/udp-echo.js
// Then: echo -n hi | nc -u -w1 localhost 4001
import dgram from 'node:dgram';

export function createEchoServer() {
  const socket = dgram.createSocket('udp4');
  socket.on('message', (msg, remote) => socket.send(`echo: ${msg}`, remote.port, remote.address));
  return socket;
}

if (import.meta.main ?? process.argv[1] === import.meta.filename) {
  createEchoServer().bind(4001, () => console.log('udp echo on localhost:4001'));
}
