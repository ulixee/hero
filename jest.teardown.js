const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

module.exports = async () => {
  try {
    if (os.platform() === 'win32') {
      execSync(`taskkill /t /f /im chrome.exe 2> nul`);
    }
    fs.rmdirSync(`${__dirname}/.cache-test`, { recursive: true });
  } catch (err) {}
};
