// The same kind of tests in JEST (from the old repo's jest examples). Run: npm run test:jest
import { jest } from '@jest/globals';
import { Cart } from '../cart.js';
import { WeatherService } from '../weather-service.js';

describe('Cart (Jest)', () => {
  let cart;
  beforeEach(() => { cart = new Cart(); });

  test('discount from 1000', () => {
    cart.add('a', 500, 2);
    expect(cart.total()).toBe(900);
  });

  test('matchers', () => {
    cart.add('pen', 10);
    expect(cart.items).toEqual([{ sku: 'pen', price: 10, quantity: 1 }]);
    expect(() => cart.add('x', 1, 0)).toThrow(RangeError);
  });
});

describe('WeatherService (Jest mocks)', () => {
  test('jest.fn() with mockResolvedValue', async () => {
    const fetchJson = jest.fn().mockResolvedValue({ tempC: 20 });
    const service = new WeatherService({ fetchJson });
    await expect(service.temperature('Delhi')).resolves.toBe(20);
    expect(fetchJson).toHaveBeenCalledTimes(1);
    expect(fetchJson).toHaveBeenCalledWith(expect.stringContaining('Delhi'));
  });
});
