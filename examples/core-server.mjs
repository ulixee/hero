import Core from '@secret-agent/core';

(async () => {
  Core.onShutdown = () => {
    console.log('Exiting Core Process');
    process.exit();
  };
  await Core.start({ coreServerPort: 1337 }, !process.env.SA_TEMPORARY_CORE);
})().catch(error => {
  console.log('ERROR starting core', error);
  process.exit(1);
});
