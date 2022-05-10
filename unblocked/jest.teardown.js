const os = require('os');
const { execSync } = require('child_process');

module.exports = () => {
  try {
    if (os.platform() === 'win32') {
      execSync(`taskkill /t /f /im chrome.exe 2> nul`);
    }
  } catch (err) {
    // ignore
  }
};
