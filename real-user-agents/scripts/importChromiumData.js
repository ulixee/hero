"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = importChromiumData;
require("@ulixee/commons/lib/SourceMapSupport");
const Fs = require("fs");
const unblocked_agent_1 = require("@ulixee/unblocked-agent");
const paths_1 = require("../lib/paths");
async function importChromiumData() {
    const agent = new unblocked_agent_1.Agent({ options: { disableMitm: true } });
    try {
        const page = await agent.newPage();
        await page.goto('https://chromium.googlesource.com/chromium/src/+refs');
        await page.waitForLoad('DomContentLoaded');
        const versions = await page.mainFrame.evaluate(`(() => {
    for (const elem of document.querySelectorAll('.RefList')) {
      if (elem.querySelector('.RefList-title').textContent === 'Tags') {
        const versionsDivs = elem.querySelectorAll('ul.RefList-items li a');
       
        return Array.from(versionsDivs).map(x => x.textContent)
      }
    }
  })()`);
        const filePath = (0, paths_1.getDataFilePath)('chromiumBuildVersions.json');
        await Fs.promises.writeFile(filePath, JSON.stringify(versions, null, 2));
    }
    finally {
        await agent.close();
    }
}
// We might also use this to check stable releases: https://chromereleases.googleblog.com/
//# sourceMappingURL=importChromiumData.js.map