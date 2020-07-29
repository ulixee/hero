const fs = require('fs');

module.exports = async () => {
  try {
    fs.rmdirSync(`${__dirname}/.cache-test`, { recursive: true });
  } catch (err) {}
};
