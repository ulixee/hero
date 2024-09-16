import '@ulixee/commons/lib/SourceMapSupport';
import * as Fs from 'fs';
import { Agent } from '@ulixee/unblocked-agent';
import { getDataFilePath } from '../lib/paths';

export default async function importChromiumData(): Promise<void> {
  const agent = new Agent({ options: { disableMitm: true } });
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
    const filePath = getDataFilePath('chromiumBuildVersions.json');
    await Fs.promises.writeFile(filePath, JSON.stringify(versions, null, 2));
  } finally {
    await agent.close();
  }
}

// We might also use this to check stable releases: https://chromereleases.googleblog.com/
