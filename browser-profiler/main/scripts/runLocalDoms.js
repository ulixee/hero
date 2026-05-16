"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = runLocalDoms;
require("@ulixee/commons/lib/SourceMapSupport");
require("../env"); // load our env before DA
require("@double-agent/config/load");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const Path = require("path");
const axios_1 = require("axios");
const fileUtils_1 = require("@ulixee/commons/lib/fileUtils");
const AssignmentsClient_1 = require("@double-agent/runner/lib/AssignmentsClient");
const saveAssignmentToProfileDir_1 = require("@double-agent/runner/lib/saveAssignmentToProfileDir");
const config_1 = require("@double-agent/config");
const getLocalOperatingSystemMeta_1 = require("@ulixee/real-user-agents/lib/getLocalOperatingSystemMeta");
const index_1 = require("../index");
const DockerUtils_1 = require("../lib/local-tooling/DockerUtils");
const ChromeUtils_1 = require("../lib/local-tooling/ChromeUtils");
const SafariUtils_1 = require("../lib/local-tooling/SafariUtils");
const getStableChromeVersions_1 = require("../lib/getStableChromeVersions");
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const defaultShouldRunDockers = Boolean(JSON.parse(process.env.RUN_DOCKERS ?? 'false'));
const defaultShouldRunLocal = Boolean(JSON.parse(process.env.RUN_LOCAL ?? 'true'));
const defaultShouldCommit = Boolean(JSON.parse(process.env.COMMIT ?? 'false'));
const baseDomsDir = Path.resolve(index_1.default.profiledDoms, 'local');
const tmpDir = Path.resolve(index_1.default.profiledDoms, '.tmp');
if ((0, fs_1.existsSync)(tmpDir))
    (0, fs_1.rmSync)(tmpDir, { recursive: true });
async function runLocalDoms(shouldRunDockers = defaultShouldRunDockers, shouldRunLocal = defaultShouldRunLocal, shouldCommit = defaultShouldCommit) {
    const browserEngineOptions = await (0, getStableChromeVersions_1.default)(15);
    for (const browserEngineOption of browserEngineOptions) {
        const major = String(browserEngineOption.major);
        if (shouldRunDockers) {
            const latestLinux = browserEngineOption.versions.find(x => x.linux);
            const fullVersion = latestLinux?.fullVersion;
            if (fullVersion) {
                await runDockerChromes(fullVersion, major, 1);
                await runDockerChromes(fullVersion, major, 2);
            }
        }
        if (shouldRunLocal) {
            const latest = browserEngineOption.versions.find(x => x.mac);
            const fullVersion = latest.fullVersion;
            await runLocalChromes(fullVersion, major, 1);
            await runLocalChromes(fullVersion, major, 2);
        }
    }
    // cleanup tmp dir
    // if (await existsAsync(tmpDir)) await Fs.rm(tmpDir, { recursive: true });
    if (shouldCommit) {
        (0, child_process_1.execSync)(`git commit -am "chore(local-doms): generate profiles" && git push`, {
            cwd: index_1.default.dataDir,
        });
    }
}
// HELPERS
async function runDockerChromes(fullVersion, majorVersion, i) {
    const engineName = 'chrome';
    const browserId = createBrowserId(engineName, majorVersion);
    const todoList = [];
    for (const automationType of ['devtools', 'nodevtools']) {
        const headType = 'headless';
        const folderName = createFolderName('linux', browserId, headType, automationType);
        const exists = await localDomsExist(`${baseDomsDir}/${folderName}`, i);
        if (exists) {
            console.log('Found %s (Docker)... SKIPPING', folderName);
        }
        else {
            todoList.push({ automationType, folderName, headType });
        }
    }
    if (!todoList.length)
        return;
    console.log('Running Chrome %s on Docker', majorVersion);
    const dockerHost = (0, DockerUtils_1.getDockerHost)();
    const dockerChromeUrl = (0, ChromeUtils_1.getChromeDownloadUrlForLinux)(fullVersion);
    const dockerName = (0, DockerUtils_1.buildChromeDocker)(majorVersion, dockerChromeUrl);
    const userAgentId = (0, config_1.createUserAgentIdFromIds)('linux', browserId);
    for (const { automationType, folderName, headType } of todoList) {
        const tag = createTagName(engineName, majorVersion, headType, automationType, i);
        console.log('------------------------------');
        console.log('Running %s (Local)', folderName);
        const assignment = await createAssignment(tag, userAgentId);
        const urls = extractDomAssignmentUrl(assignment);
        for (const url of urls) {
            const isFinishedPromise = waitUntilDomAssignmentFinishes(assignment, url);
            await (0, DockerUtils_1.startDockerAndLoadUrl)(dockerName, dockerHost, url, automationType, config_1.default.runner.assignmentsHost?.includes('//localhost'), Number(majorVersion));
            await isFinishedPromise;
            (0, DockerUtils_1.stopDocker)(dockerName);
            await new Promise(resolve => setTimeout(resolve, 5e3));
        }
        await saveDomAssignmentOutput(userAgentId, assignment);
    }
}
async function localDomsExist(folder, i) {
    if (!(await (0, fileUtils_1.existsAsync)(folder)))
        return false;
    return (await fs_1.promises.readdir(folder)).length >= i * 2;
}
async function runLocalChromes(fullVersion, majorVersion, i) {
    const engineName = 'chrome';
    const browserId = createBrowserId(engineName, majorVersion);
    const osId = getLocalOsId();
    const userAgentId = (0, config_1.createUserAgentIdFromIds)(osId, browserId);
    const todoList = [];
    for (const headType of ['headless', 'headed']) {
        for (const automationType of ['devtools', 'nodevtools']) {
            const folderName = createFolderName(osId, browserId, headType, automationType);
            const exists = await localDomsExist(`${baseDomsDir}/${folderName}`, i);
            if (exists) {
                console.log('Found %s (Local)... SKIPPING', folderName);
            }
            else {
                todoList.push({ automationType, folderName, headType });
            }
        }
    }
    if (!todoList.length)
        return;
    await (0, ChromeUtils_1.installChrome)(fullVersion);
    const executablePath = (0, ChromeUtils_1.getChromeExecutablePath)(fullVersion);
    console.log('USING ', executablePath);
    for (const { headType, automationType, folderName } of todoList) {
        const tag = createTagName(engineName, majorVersion, headType, automationType, i);
        console.log('Running %s (Local)', folderName);
        const assignment = await createAssignment(tag, userAgentId);
        const urls = extractDomAssignmentUrl(assignment);
        for (const url of urls) {
            const isFinishedPromise = waitUntilDomAssignmentFinishes(assignment, url);
            await (0, ChromeUtils_1.startChromeAndLoadUrl)(executablePath, url, headType, automationType, Number(majorVersion));
            await isFinishedPromise;
            await (0, ChromeUtils_1.stopChrome)();
        }
        await saveDomAssignmentOutput(userAgentId, assignment);
    }
}
function createTagName(engine, majorVersion, headType, automationType, i) {
    return `${engine}--${headType}-${automationType}--${i}`;
}
function createBrowserId(engine, majorVersion) {
    return `${engine}-${majorVersion}-0`;
}
function createFolderName(osId, browserId, headType, automationType) {
    return `${osId}--${browserId}--${headType}-${automationType}`;
}
function getLocalOsId() {
    const osMeta = (0, getLocalOperatingSystemMeta_1.default)();
    return `${osMeta.name}-${osMeta.version}`;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function runLocalSafaris(majorVersion, i) {
    const browserId = createBrowserId('safari', majorVersion);
    const osId = getLocalOsId();
    const userAgentId = (0, config_1.createUserAgentIdFromIds)(osId, browserId);
    for (const engine of ['safari', 'webkit']) {
        const tag = `${engine}--headed--${i}`;
        const assignment = await createAssignment(tag, userAgentId);
        const urls = extractDomAssignmentUrl(assignment);
        for (const url of urls) {
            const isFinishedPromise = waitUntilDomAssignmentFinishes(assignment, url);
            if (engine === 'safari') {
                await (0, SafariUtils_1.startSafariAndLoadUrl)(url);
            }
            else {
                await (0, SafariUtils_1.startWebKitAndLoadUrl)(url);
            }
            await isFinishedPromise;
            if (engine === 'safari') {
                await (0, SafariUtils_1.stopSafari)();
            }
            else {
                await (0, SafariUtils_1.stopWebkit)();
            }
        }
        await saveDomAssignmentOutput(userAgentId, assignment);
    }
}
async function createAssignment(tag, userAgentId) {
    return await new AssignmentsClient_1.default(tag).createSingleUserAgentIdAssignment(userAgentId);
}
function extractDomAssignmentUrl(assignment) {
    return assignment.pagesByPlugin['browser-dom-environment'].map(p => p.url);
}
async function waitUntilDomAssignmentFinishes(assignment, url) {
    const waitUntilFinishedUrl = url.replace('/?', '/wait-until-finished?');
    console.log('waitUntilDomAssignmentFinishes: ', url);
    await axios_1.default.get(waitUntilFinishedUrl);
}
async function saveDomAssignmentOutput(userAgentId, assignment) {
    const tmpFilesDir = await (0, saveAssignmentToProfileDir_1.default)(assignment, tmpDir);
    const tmpFileNames = await fs_1.promises.readdir(tmpFilesDir);
    const [name, features, i] = assignment.id.split('--');
    const filesDirName = `${userAgentId.replace('chrome', name).replace('-headless', '')}--${features || 'none'}`;
    const filesDir = Path.join(baseDomsDir, filesDirName);
    if (!(await (0, fileUtils_1.existsAsync)(filesDir)))
        await fs_1.promises.mkdir(filesDir, { recursive: true });
    for (const tmpFileName of tmpFileNames) {
        const newFileName = tmpFileName.replace('.json.gz', `--${i}.json.gz`);
        await fs_1.promises.rename(`${tmpFilesDir}/${tmpFileName}`, `${filesDir}/${newFileName}`);
    }
    await fs_1.promises.rm(tmpFilesDir, { recursive: true });
    console.log(`SAVED ${assignment.id} -> ${userAgentId}`);
}
//# sourceMappingURL=runLocalDoms.js.map