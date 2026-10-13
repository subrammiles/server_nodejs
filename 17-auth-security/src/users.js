// User storage (in memory for the lesson) with SALTED, SLOW password hashes from lesson 10.
import { hashPassword, verifyPassword } from '../../10-crypto/crypto-utils.js';

export class UserStore {
  #users = new Map();   // email -> user
  #nextId = 1;

  async register({ email, password, name, role = 'user' }) {
    const key = email.toLowerCase();
    if (this.#users.has(key)) return null;
    const user = { id: this.#nextId++, email: key, name, role, passwordHash: await hashPassword(password) };
    this.#users.set(key, user);
    return publicUser(user);
  }

  // Returns the user only if the password matches. Same result for "no such user" and "wrong password".
  async authenticate(email, password) {
    const user = this.#users.get(email.toLowerCase());
    if (!user) {
      await hashPassword(password);   // spend the same time anyway, so timing doesn't reveal which emails exist
      return null;
    }
    return (await verifyPassword(password, user.passwordHash)) ? publicUser(user) : null;
  }

  findById(id) {
    const user = [...this.#users.values()].find((u) => u.id === id);
    return user ? publicUser(user) : null;
  }

  rawByEmail(email) {
    return this.#users.get(email.toLowerCase());   // for tests: to prove the hash is stored, never the password
  }
}

// Never send password hashes (or other secrets) to clients
function publicUser({ passwordHash, ...rest }) {
  return rest;
}
