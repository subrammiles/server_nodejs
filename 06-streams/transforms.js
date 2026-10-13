// Streams process data PIECE BY PIECE (chunks), so memory stays small even for huge files.
import { Transform } from 'node:stream';

// A Transform stream: data in -> modified data out
export function upperCase() {
  return new Transform({
    transform(chunk, encoding, callback) {
      callback(null, chunk.toString().toUpperCase());
    },
  });
}

// Splits incoming text into lines, even when a line is cut across two chunks
export function splitLines() {
  let leftover = '';
  return new Transform({
    readableObjectMode: true,   // outputs strings (objects) instead of bytes
    transform(chunk, encoding, callback) {
      const lines = (leftover + chunk.toString()).split('\n');
      leftover = lines.pop();
      lines.forEach((line) => this.push(line));
      callback();
    },
    flush(callback) {
      if (leftover) this.push(leftover);
      callback();
    },
  });
}

// Parses "name,city,age" CSV lines into objects (object mode in, object mode out)
export function csvToObjects() {
  let headers = null;
  return new Transform({
    objectMode: true,
    transform(line, encoding, callback) {
      const cells = line.split(',').map((c) => c.trim());
      if (!headers) {
        headers = cells;
        return callback();
      }
      callback(null, Object.fromEntries(headers.map((h, i) => [h, cells[i]])));
    },
  });
}
