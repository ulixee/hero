const pkg = require('./package.json');
module.exports = api => {
  api.loadSource(async ({ addMetadata, addCollection }) => {
    addMetadata('browserVersion', pkg.version);
  });
};
