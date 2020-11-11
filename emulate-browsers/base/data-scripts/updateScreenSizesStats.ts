import moment from 'moment';
import axios from 'axios';
import csvParser from 'csv-parser';
import fs from 'fs';

const dataDir = `${__dirname}/../data/`;

export default async function updateBrowserStats() {
  const query = {
    device_hidden: ['desktop'].join('+'),
    region_hidden: 'US',
    granularity: 'monthly',
    'multi-device': true,
    csv: 1,
    fromMonthYear: moment()
      .subtract(1, 'month')
      .format('YYYY-MM'),
    toMonthYear: moment().format('YYYY-MM'),
  };

  const results: { resolution: [number, number]; percent: number }[] = [];
  const response = await axios.get('https://gs.statcounter.com/chart.php', {
    params: {
      ...query,
      statType_hidden: 'resolution',
    },
    responseType: 'stream',
  });
  const data = response.data.pipe(csvParser());

  for await (const res of data) {
    const [screen, share] = Object.values(res);
    if (screen.includes('x')) {
      const resolution = screen.split('x').map(Number);
      const percent = Number(share);
      results.push({ resolution, percent });
    }
  }

  fs.writeFileSync(
    `${dataDir}resolution.json`,
    JSON.stringify(
      {
        month: query.toMonthYear,
        lastModified: new Date(),
        sizes: results,
      },
      null,
      2,
    ),
  );
}
