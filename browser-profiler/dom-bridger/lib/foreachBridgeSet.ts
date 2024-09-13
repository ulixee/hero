import * as Fs from 'fs';
import * as Path from 'path';
import BrowserProfiler from '@ulixee/unblocked-browser-profiler';
import { gunzipSync } from 'zlib';
import { extractDirGroupsMap } from './BridgeUtils';
import IBridgeType from '../interfaces/IBridgeType';

const baseDomsDir = Path.resolve(BrowserProfiler.dataDir, 'profiled-doms');

export default function foreachBridgeSet(
  protocol: 'http' | 'https',
  bridge: [IBridgeType, IBridgeType],
  runFn: (key: string, dom1: any, dom2) => void,
): void {
  const dirGroupsMap = extractDirGroupsMap(bridge, baseDomsDir);

  for (const key of Object.keys(dirGroupsMap)) {
    const fileNamesBySource = dirGroupsMap[key];
    if (bridge[0] !== bridge[1] && Object.keys(fileNamesBySource).length !== 2) {
      console.log('CORRUPTED: ', key, Object.keys(fileNamesBySource));
      delete dirGroupsMap[key];
    }
  }

  for (const key of Object.keys(dirGroupsMap)) {
    const dirName1 = dirGroupsMap[key][bridge[0]];
    const dirName2 = dirGroupsMap[key][bridge[1]];

    const fileName1 = `browser-dom-environment--${protocol}--1.json.gz`;
    const fileName2 = `browser-dom-environment--${protocol}--${
      bridge[0] === bridge[1] ? '2' : '1'
    }.json.gz`;

    const domDir1 = Path.join(baseDomsDir, dirName1);
    const domDir2 = Path.join(baseDomsDir, dirName2);
    try {
      const { data: dom1 } = JSON.parse(
        gunzipSync(Fs.readFileSync(`${domDir1}/${fileName1}`)).toString(),
      );
      const { data: dom2 } = JSON.parse(
        gunzipSync(Fs.readFileSync(`${domDir2}/${fileName2}`)).toString(),
      );

      const fileName =
        bridge[0] === bridge[1] ? fileName1.replace('--1.json.gz', '--(1|2).json') : fileName1;
      const fileKey = `${key}/${fileName}`;
      runFn(fileKey, dom1, dom2);
    } catch (err) {
      console.log('couldn\t read file', err, { domDir1, domDir2 });
    }
  }
}
