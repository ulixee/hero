#!/usr/bin/env node

import * as Fs from 'fs';
import * as Path from 'path';
import DependencyInstaller from '../lib/DependencyInstaller';
import { isDebianFlavor } from '../lib/LinuxUtils';

function noOp() {
  process.stdout.write(Path.join(__dirname, 'no-op.sh'));
}

if (process.platform === 'linux') {
  (async () => {
    const isDebian = await isDebianFlavor();
    if (isDebian) {
      const path = DependencyInstaller.aptScriptPath;
      if (Fs.existsSync(path)) {
        process.stdout.write(DependencyInstaller.aptScriptPath);
        return;
      }
    }
    noOp();
  })().catch(() => null);
} else {
  noOp();
}
