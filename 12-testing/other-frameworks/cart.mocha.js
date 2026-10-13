// MOCHA (runner) + CHAI (assertions) + SINON (test doubles), the classic trio from the old repo.
// Run: npm run test:mocha
import { expect } from 'chai';
import sinon from 'sinon';
import { Cart } from '../cart.js';
import { notifier, WeatherService } from '../weather-service.js';

describe('Cart (Mocha + Chai)', () => {
  it('totals with a discount', () => {
    expect(new Cart().add('a', 500, 2).total()).to.equal(900);
  });

  it('throws on bad quantity', () => {
    expect(() => new Cart().add('x', 1, -1)).to.throw(RangeError);
  });
});

describe('Sinon', () => {
  afterEach(() => sinon.restore());

  it('stub: canned answers', async () => {
    const fetchJson = sinon.stub().resolves({ tempC: 18 });
    expect(await new WeatherService({ fetchJson }).temperature('Ooty')).to.equal(18);
    sinon.assert.calledOnce(fetchJson);
  });

  it('spy/stub on an existing method', () => {
    const send = sinon.stub(notifier, 'send');
    notifier.alertIfHot('u', 41);
    sinon.assert.calledOnceWithExactly(send, 'u', 'Heat alert: 41°C');
  });

  it('fake timers', () => {
    const clock = sinon.useFakeTimers(new Date('2026-07-03T00:00:00Z'));
    expect(new Date().toISOString()).to.equal('2026-07-03T00:00:00.000Z');
    clock.restore();
  });
});
