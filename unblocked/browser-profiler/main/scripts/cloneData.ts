import { spawnSync } from 'child_process';
import * as Fs from 'fs';
import BrowserData from '..';

const path = BrowserData.dataDir;
if (!Fs.existsSync(path)) Fs.mkdirSync(path, { recursive: true });

console.log('DOWNLOADING LOTS!! OF BROWSER PROFILE DATA.... sit tight!')
console.log(`git clone https://github.com/unblocked-web/browser-profile-data ${path}`);
spawnSync('git clone https://github.com/unblocked-web/browser-profile-data .', {
  cwd: path,
  stdio: ['inherit', 'inherit', 'inherit'],
  encoding: 'utf8',
  shell: true,
});
