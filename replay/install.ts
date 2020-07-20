#!/usr/bin/env node

import Fs from 'fs';
import TarFs from 'tar-fs';
import Axios from 'axios';
import ProgressBar from 'progress';
import { createGunzip } from 'zlib';
import { distDir, isBinaryInstalled, recordVersion, version } from './Utils';

if (process.env.SA_REPLAY_SKIP_BINARY_DOWNLOAD) {
  process.exit(0);
}

if (isBinaryInstalled()) {
  process.exit(0);
}

(async function downloadAndExtract() {
  const platform = process.env.npm_config_platform || process.platform;

  const platformNames = {
    darwin: 'mac',
    linux: 'linux',
    win32: 'win',
  };

  const response = await Axios.get(
    `https://github.com/ulixee/secret-agent/releases/download/v${version}/replay-${version}-${platformNames[platform]}.tar.gz`,
    {
      responseType: 'stream',
    },
  );
  const length = parseInt(response.headers['content-length'], 10);

  const output = Fs.createWriteStream('/tmp/SecretAgentReplay.tar.gz', { autoClose: true });

  const bar = new ProgressBar(' Downloading SecretAgent Replay [:bar]  :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: length,
  });
  for await (const chunk of response.data) {
    bar.tick(chunk.length);
    output.write(chunk);
  }

  await new Promise(resolve => {
    Fs.createReadStream('/tmp/SecretAgentReplay.tar.gz')
      .pipe(createGunzip())
      .pipe(TarFs.extract(distDir))
      .on('finish', resolve);
  });

  recordVersion();
})().catch(err => {
  console.error(err.stack);
  process.exit(1);
});
