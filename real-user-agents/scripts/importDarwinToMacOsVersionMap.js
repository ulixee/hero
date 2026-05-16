"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = importMacOsVersions;
require("@ulixee/commons/lib/SourceMapSupport");
const unblocked_agent_1 = require("@ulixee/unblocked-agent");
const fileUtils_1 = require("@ulixee/commons/lib/fileUtils");
const Fs = require("fs");
const paths_1 = require("../lib/paths");
async function importMacOsVersions() {
    const agent = new unblocked_agent_1.Agent({ options: { disableMitm: true } });
    try {
        const page = await agent.newPage();
        await page.goto('https://en.wikipedia.org/wiki/Darwin_%28operating_system%29#Release_history');
        await page.waitForLoad('DomContentLoaded');
        const versions = await page.mainFrame.evaluate(`(() => {
    const results = [];
    let headerKeys = [];
    let savedCols = [];
    for (const row of document.querySelectorAll('table.wikitable tr')) {
      let tds = [...row.querySelectorAll('td,th')];
      
      if (!row.querySelector('td')) {
        headerKeys = tds.map(x => x.lastChild.textContent.trim());
        continue;
      }
      if (!tds.length) {
        continue;
      }
      
      for (let i=0;i<tds.length;i+=1) {
        if (tds[i].rowSpan > 1) {
          savedCols.push( { td: tds[i], count: tds[i].rowSpan -1, index:i });
        }
      }
      
      if (tds.length < headerKeys.length) {
        tds = [...tds];
        for (const saved of savedCols) {
          tds.splice(saved.index-1, 0, saved.td);
          saved.count--;
        }
        savedCols = savedCols.filter(x => x.count>0);
      }
      
      const result = {};
      for (let i=0;i<headerKeys.length;i+=1) {
        const header = headerKeys[i];
        const value = tds[i].textContent.trim();
        if (header === 'Version') {
          result.darwinVersion = value;
        } 
        if (header.includes('Notes')) {
          const match =  value.match(/(?:Mac OS X|macOS|OS X) v?\\.?([\\d.]+)/);
          if (match) result.macOsVersion = match[1].trim()
        }
      }
      if (result.macOsVersion){
        results.push(result);
      }
    }
    return results;
  })()`);
        const filePath = (0, paths_1.getDataFilePath)('os-mappings/darwinToMacOsVersionMap.json');
        const existing = await (0, fileUtils_1.readFileAsJson)(filePath);
        for (const { darwinVersion, macOsVersion } of versions) {
            existing[darwinVersion] = macOsVersion;
        }
        const sorted = Object.fromEntries(Object.entries(existing).sort(([a], [b]) => {
            const aParts = a.split('.');
            const bParts = b.split('.');
            for (let i = 0; i < Math.max(aParts.length, bParts.length); i += 1) {
                const aValue = Number(aParts[i] ?? 0);
                const bValue = Number(bParts[i] ?? 0);
                if (aValue !== bValue)
                    return aValue - bValue;
            }
            return 0;
        }));
        await Fs.promises.writeFile(filePath, JSON.stringify(sorted, null, 2));
    }
    finally {
        await agent.close();
    }
}
//# sourceMappingURL=importDarwinToMacOsVersionMap.js.map