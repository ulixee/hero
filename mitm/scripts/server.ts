import { MitmProxy as MitmServer } from '../index';

(async function run() {
  await MitmServer.start();
})().catch(error => {
  // eslint-disable-next-line no-console
  console.log('ERROR: ', error);
});
