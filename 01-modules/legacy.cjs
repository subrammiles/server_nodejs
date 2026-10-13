// CommonJS (CJS): Node's original module system. The .cjs extension forces CJS
// even though package.json says "type": "module". You will meet this in older code
// (require / module.exports), e.g. most of the old version of this repo.

const greeting = 'Hello from CommonJS';

function shout(text) {
  return text.toUpperCase() + '!';
}

module.exports = { greeting, shout };
