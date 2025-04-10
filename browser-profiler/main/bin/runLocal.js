#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Installation on a mac:
 *
 * crontab -e
 *
 * wake computer:
 * sudo pmset repeat wakeorpoweron MTWRFSU 06:00:00
 *
 * add an entry
 * 1 6 * * * cd $HOME/Projects/ulixee/hero/browser-profiler/build/ && npx runLocal
 */
require("@ulixee/commons/lib/SourceMapSupport");
const child_process_1 = require("child_process");
const runLocalDoms_1 = require("../scripts/runLocalDoms");
const paths_1 = require("../paths");
(async function runLocal() {
    console.log('Pulling latest from Profile Data');
    (0, child_process_1.spawnSync)('git pull', {
        cwd: paths_1.profileDataDir,
        stdio: ['inherit', 'inherit', 'inherit'],
        encoding: 'utf8',
        shell: true,
    });
    await (0, runLocalDoms_1.default)(false, true).catch(console.error);
    console.log('Adding all new files');
    (0, child_process_1.spawnSync)(`git add . && git commit -m 'chore: run local doms on mac'`, {
        cwd: paths_1.profileDataDir,
        stdio: ['inherit', 'inherit', 'inherit'],
        encoding: 'utf8',
        shell: true,
    });
    console.log('Pushing to main');
    (0, child_process_1.spawnSync)('git push origin main', {
        cwd: paths_1.profileDataDir,
        stdio: ['inherit', 'inherit', 'inherit'],
        encoding: 'utf8',
        shell: true,
    });
})().catch(console.error);
//# sourceMappingURL=runLocal.js.map