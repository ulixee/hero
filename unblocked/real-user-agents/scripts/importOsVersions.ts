import '@ulixee/commons/lib/SourceMapSupport';
import * as Fs from 'fs';
import { Agent } from '@ulixee/unblocked-agent';
import { readFileAsJson } from '@ulixee/commons/lib/fileUtils';
import moment = require('moment');
import { getDataFilePath } from '../lib/paths';

export default async function importOsVersions(): Promise<void> {
  const agent = new Agent({ options: { disableMitm: true } });
  try {
    const filePath = getDataFilePath('manual/osReleaseDates.json');
    const existing = await readFileAsJson<{ [osId: string]: string }>(filePath);

    const page = await agent.newPage();
    await page.goto(
      'https://robservatory.com/a-full-history-of-macos-os-x-release-dates-and-rates/',
    );
    await page.waitForLoad('DomContentLoaded');
    {
      const versions = await page.mainFrame.evaluate<
        { date: string; year: string; version: string }[]
      >(`(() => {
        let year;
        let yearRows = 0;
        let date;
        let dateRows = 0;
        const results = [];
        for (const elem of document.querySelectorAll('tr')) {
          const tds = elem.querySelectorAll('td');
          if (!tds.length) continue;
          let startCounter = 0;
          if (yearRows <= 0) {
            year = tds[0].textContent;
            yearRows = tds[0].rowSpan;
            startCounter++;
          }
          if (dateRows <= 0) {
            date = tds[startCounter].textContent;
            dateRows = tds[startCounter].rowSpan;
            startCounter+=2;
          }
          const version = tds[startCounter].textContent;
          results.push({ date, year, version });
          yearRows -= 1;
          dateRows -= 1;
        }
        return results;
      })()`);
      for (const version of versions) {
        let key = `mac-os-${version.version.replace(/\./g, '-')}`;
        if (key?.endsWith('-0')) key = key.substring(0, key.length - 2);
        if (!key) continue;
        if (!version.version.match(/^[\d.]+$/)) continue;
        existing[key] ??= moment(`${version.date} ${version.year}`, 'MMM DD YYYY').format(
          'YYYY-MM-DD',
        );
      }
    }

    {
      await page.goto('https://en.wikipedia.org/wiki/List_of_Microsoft_Windows_versions');
      await page.waitForLoad('DomContentLoaded');
      const versions = await page.evaluate<{ version: string[]; date: string }[]>(`(() => {
    const table = document.querySelector('table.wikitable');
    let colSpanTimes = 0;
    let skipNestedTimes = 0;
    const rows = [...table.querySelectorAll(':scope > tbody > tr')].map(x => {
       const tds = x.querySelectorAll('td');
       if (tds.length < 3) return;
       skipNestedTimes--;
       if (skipNestedTimes > 0) return;
       if (tds[0].rowSpan > 1) skipNestedTimes = tds[0].rowSpan -1; 
        colSpanTimes -= 1;
        const offset = colSpanTimes > 1 ? 1 : 2;
       if (tds[1].rowSpan > 1) colSpanTimes = tds[1].rowSpan;
        return {
         version: tds[0].textContent.split('version').map(x=>x.trim()),
         date: tds[offset].textContent.trim()
        }
    });
    return rows.filter(Boolean);
  })()`);
      for (const version of versions) {
        if (!version.version[0].includes('Windows')) continue;
        if (Number(version.date.split('-').shift()) < 2009) continue;

        version.version[0] = version.version[0]
          .toLowerCase()
          .trim()
          .replace(/\s/g, '-')
          .replace(/\./g, '-');
        if (version.version[0].split('-').length === 2) version.version[0] += '-0';
        const key = version.version.join('-');
        if (!key) continue;
        if (key === '10-0-22H2') version.date = '2022-07-28';
        if (!version.date.match(/^[\d-]+$/)) continue;
        existing[key] ??= version.date;
      }
    }

    const sorted = Object.fromEntries(
      Object.entries(existing).sort(([a], [b]) => {
        const aParts = a.replace('mac-os', 'mac').split('-');
        const bParts = b.replace('mac-os', 'mac').split('-');
        if (aParts[0] !== bParts[0]) return aParts[0].localeCompare(bParts[0]);

        for (let i = 1; i < Math.max(aParts.length, bParts.length); i += 1) {
          const aValue = Number(aParts[i] ?? 0);
          const bValue = Number(bParts[i] ?? 0);
          if (aValue !== bValue) return bValue - aValue;
        }
        return 0;
      }),
    );
    await Fs.promises.writeFile(filePath, JSON.stringify(sorted, null, 2));
  } finally {
    await agent.close();
  }
}
