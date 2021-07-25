#!/usr/bin/env node

import * as Fs from 'fs';
import * as Tar from 'tar';
import * as ProgressBar from 'progress';
import { createGunzip } from 'zlib';
import * as os from 'os';
import * as Path from 'path';
import { IncomingMessage } from 'http';
import { httpGet } from '@ulixee/commons/lib/downloadFile';
import { getInstallDirectory, isBinaryInstalled, recordVersion, version } from './Utils';

if (Boolean(JSON.parse(process.env.HERO_REPLAY_SKIP_BINARY_DOWNLOAD ?? 'false')) === true) {
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

  const tmpFile = Path.join(os.tmpdir(), 'UlixeeReplay.tar.gz');
  const output = Fs.createWriteStream(tmpFile, { autoClose: true });

  const bar = new ProgressBar(' Downloading Ulixee Replay [:bar]  :percent :etas', {
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
    const req = httpGet(filepath, res => {
      if (res.statusCode >= 400) {
        return reject(
          new Error(
            `ERROR downloading required  library - ${res.statusCode}:${res.statusMessage}`,
          ),
        );
      }

      resolve(res);
    });
    req.on('error', err => {
      console.log('ERROR downloading required MitM library %s', filepath, err);
      reject(err);
    });
  });
}
