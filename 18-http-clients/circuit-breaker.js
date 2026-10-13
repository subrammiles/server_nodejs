// CIRCUIT BREAKER: when a dependency keeps failing, stop calling it for a while.
// Callers fail fast (instead of waiting for timeouts), and the struggling service gets time to recover.
//
//   CLOSED --(N failures)--> OPEN --(cooldown passed)--> HALF_OPEN --success--> CLOSED
//                                                           \--failure--> OPEN
export class CircuitOpenError extends Error {}

export class CircuitBreaker {
  constructor({ failureThreshold = 3, cooldownMs = 10_000, now = () => Date.now() } = {}) {
    this.failureThreshold = failureThreshold;
    this.cooldownMs = cooldownMs;
    this.now = now;
    this.state = 'CLOSED';
    this.failures = 0;
    this.openedAt = 0;
  }

  async call(fn) {
    if (this.state === 'OPEN') {
      if (this.now() - this.openedAt < this.cooldownMs) throw new CircuitOpenError('Circuit open: failing fast');
      this.state = 'HALF_OPEN';   // let ONE trial request through
    }
    try {
      const result = await fn();
      this.state = 'CLOSED';
      this.failures = 0;
      return result;
    } catch (error) {
      this.failures++;
      if (this.state === 'HALF_OPEN' || this.failures >= this.failureThreshold) {
        this.state = 'OPEN';
        this.openedAt = this.now();
      }
      throw error;
    }
  }
}
