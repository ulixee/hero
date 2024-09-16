#!/usr/bin/env node
/**
 * Installation on a mac:
 *
 * crontab -e
 *
 * wake computer:
 * sudo pmset repeat wakeorpoweron MTWRFSU 06:00:00
 *
 * add an entry
 * 1 6 * * * cd $HOME/Projects/ulixee/unblocked/browser-profiler/build/ && npx runLocal
 */
import '@ulixee/commons/lib/SourceMapSupport';
import { spawnSync } from 'child_process';
import runLocalDoms from '../scripts/runLocalDoms';
import { profileDataDir } from '../paths';

(async function runLocal(): Promise<void> {
  console.log('Pulling latest from Profile Data');
  spawnSync('git pull', {
    cwd: profileDataDir,
    stdio: ['inherit', 'inherit', 'inherit'],
    encoding: 'utf8',
    shell: true,
  });
  await runLocalDoms(false, true).catch(console.error);

  console.log('Adding all new files');
  spawnSync(`git add . && git commit -m 'chore: run local doms on mac'`, {
    cwd: profileDataDir,
    stdio: ['inherit', 'inherit', 'inherit'],
    encoding: 'utf8',
    shell: true,
  });
  console.log('Pushing to main');
  spawnSync('git push origin main', {
    cwd: profileDataDir,
    stdio: ['inherit', 'inherit', 'inherit'],
    encoding: 'utf8',
    shell: true,
  });
})().catch(console.error);
