// Run: node 04-events/demo.js
import { once } from 'node:events';
import { OrderService } from './order-events.js';

const orders = new OrderService();

orders.on('placed', (order) => console.log('email   -> confirmation for order', order.id));
orders.on('placed', (order) => console.log('stock   -> reserve items for order', order.id));
orders.once('placed', () => console.log('once    -> first order ever!'));
orders.on('error', (err) => console.log('error   ->', err.message));

orders.place('alice', 250);
orders.place('bob', 99);
orders.place('eve', -5);

console.log('listeners for "placed":', orders.listenerCount('placed'));

// Wait for an event with a promise
setTimeout(() => orders.place('carol', 10), 50);
const [order] = await once(orders, 'placed');
console.log('awaited -> order', order.id, 'from', order.customer);
