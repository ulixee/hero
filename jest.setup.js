const fs = require('fs');

module.exports = () => {
  try {
    fs.rmdirSync(`${__dirname}/.cache-test`, { recursive: true });
  } catch (err) {
    // ignore
  }
};
