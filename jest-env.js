const path = require('path');
const rimraf = require('rimraf');
const NodeEnvironment = require('jest-environment-node');

process.env.ULX_LOGGER_LEVEL = process.env.ULX_LOGGER_LEVEL || 'error';
const cacheDir = path.resolve(__dirname, './.cache-test');

class CustomEnvironment extends NodeEnvironment {
  constructor(config) {
    super(
      Object.assign({}, config, {
        globals: Object.assign({}, config.globals, {
          Uint8Array,
          ArrayBuffer,
        }),
      }),
    );
    rimraf.sync(cacheDir);
  }

  async setup() {
    await super.setup();
    this.global.process.env.ULX_LOGGER_LEVEL = process.env.ULX_LOGGER_LEVEL;
  }

  async teardown() {
    await super.teardown();
  }
}

module.exports = CustomEnvironment;
