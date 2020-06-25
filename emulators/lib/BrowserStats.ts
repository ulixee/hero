import moment from 'moment';
import axios from 'axios';
import csvParser from 'csv-parser';
import fs from 'fs';

const dataDir = `${__dirname}/../data/`;

export default async function browserStats() {
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

  const results: { [browser: string]: number[] } = {};
  const response = await axios.get('https://gs.statcounter.com/chart.php', {
    params: {
      ...query,
      statType_hidden: 'browser_version',
    },
    responseType: 'stream',
  });
  const data = response.data.pipe(csvParser());

  for await (const res of data) {
    for (const [entry, pct] of Object.entries(res)) {
      if (entry === 'Date') continue;
      if (!results[entry]) results[entry] = [];
      results[entry].push(Number(pct));
    }
  }

  const averages = Object.entries(results)
    .map(x => {
      return {
        browser: x[0],
        usage: Math.round(x[1].reduce((a, b) => a + b, 0) / x[1].length),
      };
    })
    .filter(x => x.usage > 1);

  console.log(averages);
  fs.writeFileSync(
    `${dataDir}browsers.json`,
    JSON.stringify(
      {
        fromMonthYear: query.fromMonthYear,
        toMonthYear: query.toMonthYear,
        lastModified: new Date(),
        browsers: averages,
      },
      null,
      2,
    ),
  );
}
