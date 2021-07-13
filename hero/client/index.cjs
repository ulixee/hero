const cjsImport = require('./index.js');

// create a true default export
module.exports = cjsImport.default;

for (const key in cjsImport) {
  if (!cjsImport.hasOwnProperty(key) || key in module.exports) continue;
  module.exports[key] = cjsImport[key];
}
