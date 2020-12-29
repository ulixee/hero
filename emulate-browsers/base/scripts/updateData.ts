import * as Fs from 'fs';
import * as Path from 'path';

const slabDataDir = process.env.SLAB_DATA_DIR || Path.resolve(__dirname, '../../../../slab/.data');
const slabBasicsDir = Path.join(slabDataDir, 'basics');
const dataDir = Path.resolve(__dirname, '../data');

const darwinToMacOsVersionMap = Fs.readFileSync(`${slabBasicsDir}/darwinToMacOsVersionMap.json`, 'utf8');
const windowsToWindowsVersionMap = Fs.readFileSync(`${slabBasicsDir}/windowsToWindowsVersionMap.json`, 'utf8');

Fs.writeFileSync(`${dataDir}/darwinToMacOsVersionMap.json`, darwinToMacOsVersionMap);
Fs.writeFileSync(`${dataDir}/windowsToWindowsVersionMap.json`, windowsToWindowsVersionMap);
