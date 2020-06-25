import { MitmProxy as MitmServer } from '../index';

(async function run() {
  const server = await MitmServer.start();
})().catch(error => {
  console.log('ERROR: ', error);
});
