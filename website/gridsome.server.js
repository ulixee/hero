module.exports = api => {
  api.loadSource(async ({ addMetadata, addCollection }) => {
    addMetadata('browserVersion', '1.0.0-alpha')
  });
};
