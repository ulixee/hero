import * as Fs from 'fs';
import * as Path from 'path';
import getAllCollectPlugins from '@double-agent/collect/lib/getAllPlugins';
import getAllAnalyzePlugins from '@double-agent/analyze/lib/getAllPlugins';
import { outputDir } from '../paths';

const header = `Name | Description
--- | :---`;
export default function buildPluginsList(pluginType: 'collect' | 'analyze'): void {
  const outputFile = Path.resolve(outputDir, `${pluginType}-plugins.md`);
  const getAllPlugins = pluginType === 'collect' ? getAllCollectPlugins : getAllAnalyzePlugins;
  const allPlugins = getAllPlugins(true);
  let md = header;
  for (const plugin of allPlugins) {
    md += `\n${plugin.id} | ${plugin.summary}`;
  }
  Fs.writeFileSync(outputFile, md);
}
