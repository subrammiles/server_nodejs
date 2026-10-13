// A tiny file-based "database": one JSON file per note. Shows fs/promises and path in real use.
import { mkdir, readFile, readdir, rm, stat, writeFile, appendFile } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';

export class NotesStore {
  constructor(directory) {
    this.directory = resolve(directory);   // absolute path, independent of the current working directory
  }

  async init() {
    await mkdir(this.directory, { recursive: true });   // no error if it already exists
    return this;
  }

  #fileFor(id) {
    // SECURITY: never build paths from raw user input; "../../etc/passwd" would escape the folder
    if (!/^[a-z0-9-]+$/.test(id)) throw new Error(`Invalid note id: ${id}`);
    return join(this.directory, `${id}.json`);
  }

  async save(id, text) {
    const note = { id, text, savedAt: new Date().toISOString() };
    await writeFile(this.#fileFor(id), JSON.stringify(note, null, 2));
    await appendFile(join(this.directory, 'audit.log'), `${note.savedAt} saved ${id}\n`);
    return note;
  }

  async get(id) {
    try {
      return JSON.parse(await readFile(this.#fileFor(id), 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT') return null;   // "not found" is expected, not a crash
      throw error;
    }
  }

  async list() {
    const files = await readdir(this.directory);
    return files.filter((f) => extname(f) === '.json').map((f) => basename(f, '.json')).sort();
  }

  async sizeOf(id) {
    return (await stat(this.#fileFor(id))).size;
  }

  async delete(id) {
    await rm(this.#fileFor(id), { force: true });   // force: no error if missing
  }
}
