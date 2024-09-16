#!/usr/bin/env node
import { httpGet } from '@ulixee/commons/lib/downloadFile';
import * as Tar from 'tar';
import { createGunzip } from 'zlib';
import { emulatorDataDir } from '../paths';

/**
 * Download the latest data files for the browser engines into ./data
 */
const url = 'https://github.com/ulixee/unblocked-emulator-data/archive/refs/heads/main.tar.gz';

(async function downloadData() {
  return new Promise((resolve, reject) => {
    const request = httpGet(url, response => {
      if (response.statusCode !== 200) {
        const error = new Error(
          `Download failed: server returned code ${response.statusCode}. URL: ${url}`,
        );
        // consume response data to free up memory
        response.resume();
        reject(error);
        return;
      }

      response
        .pipe(createGunzip())
        .pipe(
          Tar.extract({
            filter: (path, entry) => {
              const prefix = path.indexOf('/as-chrome-');
              if (prefix !== -1) {
                // @ts-expect-error
                entry.path = path.substring(prefix + 1);
              }
              return true;
            },
            cwd: emulatorDataDir,
          }),
        )
        .on('finish', resolve);
    });
    request.once('error', reject);
  });
})()
  .then(() => {
    // eslint-disable-next-line no-console
    console.info('Browser data downloaded successfully');
    process.exit(0);
    return null;
  })
  .catch(console.error);
