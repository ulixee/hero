import buildPluginsList from './buildPluginsList';
import buildReadme from './buildReadme';

(async function generate() {
  await buildPluginsList('collect');
  await buildPluginsList('analyze');
  await buildReadme();
})().catch(console.error);
