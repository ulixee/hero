import * as Fs from 'fs';
import IBridgeType from '../interfaces/IBridgeType';

const FOLDER_MATCH = /chrome-(8|9|10|11)[0-9]/;

export function extractDirGroupsMap(
  bridge: [IBridgeType, IBridgeType],
  baseDir: string,
): { [name: string]: { [key: string]: string } } {
  const dirGroupsMap: { [name: string]: { [key: string]: string } } = {};

  for (const source of ['browserstack', 'local']) {
    const dirNames = Fs.readdirSync(`${baseDir}/${source}`).filter(x => x.match(FOLDER_MATCH));
    for (const dirName of dirNames) {
      let [osId, browserId, features] = dirName.split('--'); // eslint-disable-line prefer-const

      const featuresArray = features.replace('selenium', 'devtools').split('-');
      if (bridge.includes(source as IBridgeType)) {
        featuresArray.splice(0, 0, source);
      }
      const type = featuresArray.includes(bridge[0]) ? bridge[0] : bridge[1];
      features = featuresArray
        .map(x => (bridge.includes(x as IBridgeType) ? `(${bridge.join('|')})` : x))
        .join('-');

      const key = [osId, browserId, features].filter(x => x).join('--');
      dirGroupsMap[key] = dirGroupsMap[key] || {};
      dirGroupsMap[key][type] = `${source}/${dirName}`;
    }
  }

  return dirGroupsMap;
}

export function pathIsPatternMatch(path: string, pattern: string): boolean {
  if (pattern.charAt(0) === '*') {
    return path.includes(pattern.substr(1));
  }
  return path.startsWith(pattern);
}
