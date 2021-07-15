import Core from '@ulixee/hero-core';

(async () => {
  Core.onShutdown = () => {
    console.log('Exiting Core Process');
    process.exit();
  };
  await Core.start({ coreServerPort: 1337 }, !process.env.HERO_TEMPORARY_CORE);
})().catch(error => {
  console.log('ERROR starting core', error);
  process.exit(1);
});
