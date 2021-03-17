#!/usr/bin/env node

import * as Fs from 'fs';
import * as Https from 'https';
import * as Tar from 'tar';
import * as ProgressBar from 'progress';
import { createGunzip } from 'zlib';
import * as os from 'os';
import * as Path from 'path';
import { IncomingMessage } from 'http';
import { getInstallDirectory, isBinaryInstalled, recordVersion, version } from './Utils';

if (Boolean(JSON.parse(process.env.SA_REPLAY_SKIP_BINARY_DOWNLOAD ?? 'false')) === true) {
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

  let archAddon = '';
  if (platform === 'darwin' && os.arch() === 'arm64') archAddon = '-arm64';

  const response = await download(
    `https://github.com/ulixee/secret-agent/releases/download/v${version}/replay-${version}-${platformNames[platform]}${archAddon}.tar.gz`,
  );
  const length = parseInt(response.headers['content-length'], 10);

  const tmpFile = Path.join(os.tmpdir(), 'SecretAgentReplay.tar.gz');
  const output = Fs.createWriteStream(tmpFile, { autoClose: true });

  const bar = new ProgressBar(' Downloading SecretAgent Replay [:bar]  :percent :etas', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: length,
  });
  for await (const chunk of response) {
    bar.tick(chunk.length);
    output.write(chunk);
  }

  const installDir = getInstallDirectory();
  if (!Fs.existsSync(installDir)) Fs.mkdirSync(installDir, { recursive: true });

  await new Promise(resolve => {
    Fs.createReadStream(tmpFile)
      .pipe(createGunzip())
      .pipe(
        Tar.extract({
          cwd: installDir,
        }),
      )
      .on('finish', resolve);
  });

  recordVersion();
})().catch(err => {
  console.error(err.stack);
  process.exit(1);
});

function download(filepath: string): Promise<IncomingMessage> {
  return new Promise<IncomingMessage>((resolve, reject) => {
    const req = Https.get(filepath, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location).then(resolve).catch(reject);
      }

      try {
        resolve(res);
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', err => {
      console.log('ERROR downloading needed Secret Agent library %s', filepath, err);
      reject(err);
    });
  });
}
