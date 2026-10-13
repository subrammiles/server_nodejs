// Code with DEPENDENCIES (network, clock): the reason mocks exist.
// The HTTP function is INJECTED, so tests can pass a fake instead of calling the internet.
export class WeatherService {
  #cache = new Map();

  constructor({ fetchJson, cacheTtlMs = 60_000, now = () => Date.now() }) {
    this.fetchJson = fetchJson;
    this.cacheTtlMs = cacheTtlMs;
    this.now = now;
  }

  async temperature(city) {
    const cached = this.#cache.get(city);
    if (cached && this.now() - cached.at < this.cacheTtlMs) return cached.value;

    const data = await this.fetchJson(`https://api.example.com/weather?city=${encodeURIComponent(city)}`);
    if (typeof data?.tempC !== 'number') throw new Error(`Bad weather data for ${city}`);
    this.#cache.set(city, { value: data.tempC, at: this.now() });
    return data.tempC;
  }
}

export const notifier = {
  send(user, message) {
    throw new Error('would send a real SMS');   // tests must never call this for real
  },
  alertIfHot(user, tempC) {
    if (tempC > 40) this.send(user, `Heat alert: ${tempC}°C`);
  },
};
