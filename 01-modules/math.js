// ES Modules (ESM): the standard JavaScript module system, and the default in this repo
// because package.json says "type": "module".

// Named exports: import { add } from './math.js'
export const PI = 3.14159;

export function add(a, b) {
  return a + b;
}

export function circleArea(radius) {
  return PI * radius * radius;
}

// One default export per module: import anyName from './math.js'
export default function multiply(a, b) {
  return a * b;
}
