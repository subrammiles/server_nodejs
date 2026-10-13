// Code under test: a shopping cart with pricing rules.
export class Cart {
  #items = new Map();

  add(sku, price, quantity = 1) {
    if (!Number.isInteger(quantity) || quantity <= 0) throw new RangeError('quantity must be a positive integer');
    if (price < 0) throw new RangeError('price must not be negative');
    const current = this.#items.get(sku) ?? { sku, price, quantity: 0 };
    this.#items.set(sku, { ...current, quantity: current.quantity + quantity });
    return this;
  }

  remove(sku) {
    this.#items.delete(sku);
    return this;
  }

  get items() {
    return [...this.#items.values()];
  }

  // 10% off orders of 1000 or more; amounts rounded to 2 decimals
  total() {
    const subtotal = this.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const discount = subtotal >= 1000 ? subtotal * 0.1 : 0;
    return Math.round((subtotal - discount) * 100) / 100;
  }
}
