// Jest runs these files only via: npm run test:jest
export default {
  rootDir: import.meta.dirname,
  testMatch: ['**/*.jest.js'],
  transform: {},   // native ESM, no Babel
};
