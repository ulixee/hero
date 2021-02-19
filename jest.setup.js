const fs = require('fs');

module.exports = () => {
  try {
    fs.rmdirSync(`${__dirname}/.sessions-test`, { recursive: true });
  } catch (err) {
    // ignore
  }
};
