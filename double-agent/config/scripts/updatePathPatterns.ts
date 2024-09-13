import '@ulixee/commons/lib/SourceMapSupport';
import * as Fs from 'fs';
import * as Path from 'path';
import Config from '../index';

export default function updatePathPatterns(): void {
  const profilerPatternsDir = Path.join(Config.profilesDataDir, 'dom-bridges/path-patterns');
  if (!Fs.existsSync(profilerPatternsDir)) return;

  const localPathPatternsDir = Path.join(Config.dataDir, 'path-patterns');
  if (!Fs.existsSync(localPathPatternsDir)) Fs.mkdirSync(localPathPatternsDir, { recursive: true });
  for (const fileName of Fs.readdirSync(profilerPatternsDir)) {
    const fromFilePath = Path.join(profilerPatternsDir, fileName);
    const toFilePath = Path.join(localPathPatternsDir, fileName);
    const data = Fs.readFileSync(fromFilePath, 'utf8');
    Fs.writeFileSync(toFilePath, data);
  }
}
