import '@ulixee/commons/lib/SourceMapSupport';
import * as Fs from 'fs';
import axios from 'axios';
import csvParser = require('csv-parser');
import *  as moment from 'moment';
import { readFileAsJson } from '@ulixee/commons/lib/fileUtils';
import { getDataFilePath } from '../lib/paths';
import { IStatcounterMarketshare } from '../data';

export default async function updateStatcounterData(): Promise<void> {
  const query = {
    device_hidden: ['desktop'].join('+'),
    region_hidden: 'US',
    granularity: 'monthly',
    'multi-device': true,
    csv: 1,
    fromMonthYear: moment().subtract(1, 'month').format('YYYY-MM'),
    toMonthYear: moment().format('YYYY-MM'),
  };
  const stats = ['os_combined', 'macos_version', 'windows_version', 'browser_version'];
  for (const stat of stats) {
    const filePath = getDataFilePath(`external-raw/statcounter/${stat}.json`);
    const data = await readFileAsJson<IStatcounterMarketshare>(filePath);
    if (moment().isSame(moment(data.lastModified), 'month')) {
      console.log(`Data still current for ${stat}`);
      continue;
    }

    const response = await axios.get('https://gs.statcounter.com/chart.php', {
      params: {
        ...query,
        statType_hidden: stat,
      },
      responseType: 'stream',
    });

    const results: { [entry: string]: [string, string] } = {};
    const updated = await new Promise<IStatcounterMarketshare>(resolve => {
      response.data
        .pipe(csvParser())
        .on('data', res => {
          const slot = res.Date === query.fromMonthYear ? 0 : 1;
          for (const [entry, pct] of Object.entries(res)) {
            if (entry === 'Date') continue;
            if (!results[entry]) results[entry] = ['-1', '-1'];
            results[entry][slot] = pct as string;
          }
        })
        .on('end', () => {
          console.log(stat, results);
          resolve({
            fromMonthYear: query.fromMonthYear,
            toMonthYear: query.toMonthYear,
            lastModified: new Date().toISOString(),
            results,
          });
        });
    });
    await Fs.promises.writeFile(filePath, JSON.stringify(updated, null, 2));
    console.log(`SAVED TO ${filePath}`);
  }
}
