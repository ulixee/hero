const moment = require('moment');

export function dateToTimeAgo(datestr: string) {
  const date = moment(datestr);
  const time = date.format('h:mma');

  const isToday = moment().isSame(date, 'day');
  if (isToday) return time;

  const isYesterday = moment()
    .add(-1, 'days')
    .isSame(date, 'day');
  if (isYesterday) return `Yesterday ${time}`;

  return `${date.format('MMM D')} at ${time}`;
}
