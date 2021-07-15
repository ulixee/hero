// eslint-disable-next-line import/no-extraneous-dependencies
const SetupAwaitedHandler = require('@ulixee/hero/lib/SetupAwaitedHandler');

// Jest tries to deeply recursively extract properties from objects when a test breaks - this does not play nice with AwaitedDom
const originGetProperty = SetupAwaitedHandler.delegate.getProperty;
SetupAwaitedHandler.delegate.getProperty = function getProperty(...args) {
  const parentPath = new Error().stack;
  if (parentPath.includes('deepCyclicCopy')) {
    return null;
  }
  // eslint-disable-next-line prefer-rest-params
  return originGetProperty(...args);
};
