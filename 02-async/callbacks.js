// The ORIGINAL async style in Node: error-first callbacks.
// Convention: callback(error, result). Exactly one call: either an error OR a result.
import { readFile } from 'node:fs';

export function readJson(path, callback) {
  readFile(path, 'utf8', (err, text) => {
    if (err) {
      return callback(err);          // always `return` after reporting an error
    }
    try {
      callback(null, JSON.parse(text));
    } catch (parseError) {
      callback(parseError);
    }
  });
}

// "Callback hell": each step nests deeper, and every level must handle errors.
// This pain is why promises and async/await were created (see promises.js).
export function loadTwoFilesWithCallbacks(pathA, pathB, callback) {
  readJson(pathA, (errA, a) => {
    if (errA) return callback(errA);
    readJson(pathB, (errB, b) => {
      if (errB) return callback(errB);
      callback(null, { ...a, ...b });
    });
  });
}
