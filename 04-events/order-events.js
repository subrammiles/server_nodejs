// EventEmitter: the observer pattern built into Node. Streams, HTTP servers, sockets
// and child processes are all EventEmitters.
import { EventEmitter } from 'node:events';

export class OrderService extends EventEmitter {
  #nextId = 1;

  place(customer, amount) {
    if (amount <= 0) {
      // The special 'error' event: if nobody listens, emit('error') THROWS and can crash the process
      this.emit('error', new Error(`Invalid amount ${amount}`));
      return null;
    }
    const order = { id: this.#nextId++, customer, amount };
    this.emit('placed', order);   // listeners run synchronously, in registration order
    return order;
  }
}

// A minimal EventEmitter written by hand (from the old repo) to show there's no magic
export class TinyEmitter {
  #listeners = new Map();

  on(event, listener) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, []);
    this.#listeners.get(event).push(listener);
    return this;
  }

  off(event, listener) {
    this.#listeners.set(event, (this.#listeners.get(event) ?? []).filter((l) => l !== listener));
    return this;
  }

  emit(event, ...args) {
    const listeners = this.#listeners.get(event) ?? [];
    listeners.forEach((listener) => listener(...args));
    return listeners.length > 0;
  }
}
