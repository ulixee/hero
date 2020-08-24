const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

module.exports = async () => {
  try {
    if (os.platform() === 'win32') {
      execSync(`TASKKILL /IM chrome.exe /F`);
    }
    fs.rmdirSync(`${__dirname}/.cache-test`, { recursive: true });
  } catch (err) {}
};
