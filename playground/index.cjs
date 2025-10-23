const cjsImport = require('./index.js');

// create a true default export
module.exports = cjsImport.default;

for (const key in cjsImport) {
  module.exports[key] = cjsImport[key];
}
