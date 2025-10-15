"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const Fs = require("fs");
const __1 = require("..");
const path = __1.default.dataDir;
if (!Fs.existsSync(path))
    Fs.mkdirSync(path, { recursive: true });
console.log('DOWNLOADING LOTS!! OF BROWSER PROFILE DATA.... sit tight!');
console.log(`git clone https://github.com/ulixee/browser-profile-data ${path}`);
(0, child_process_1.spawnSync)('git clone https://github.com/ulixee/browser-profile-data .', {
    cwd: path,
    stdio: ['inherit', 'inherit', 'inherit'],
    encoding: 'utf8',
    shell: true,
});
//# sourceMappingURL=cloneData.js.map