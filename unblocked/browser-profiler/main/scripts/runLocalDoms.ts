import '@ulixee/commons/lib/SourceMapSupport';
import '../env'; // load our env before DA
import '@double-agent/config/load';
import { existsSync, promises as Fs, rmSync } from 'fs';
import * as Path from 'path';
import Axios from 'axios';
import { existsAsync } from '@ulixee/commons/lib/fileUtils';
import AssignmentsClient, { IAssignment } from '@double-agent/runner/lib/AssignmentsClient';
import saveAssignmentToProfileDir from '@double-agent/runner/lib/saveAssignmentToProfileDir';
import Config, { createUserAgentIdFromIds } from '@double-agent/config';
import getLocalOperatingSystemMeta from '@ulixee/real-user-agents/lib/getLocalOperatingSystemMeta';
import BrowserProfiler from '../index';
import {
  buildChromeDocker,
  getDockerHost,
  startDockerAndLoadUrl,
  stopDocker,
} from '../lib/local-tooling/DockerUtils';
import {
  getChromeDownloadUrlForLinux,
  getChromeExecutablePath,
  installChrome,
  startChromeAndLoadUrl,
  stopChrome,
} from '../lib/local-tooling/ChromeUtils';
import {
  startSafariAndLoadUrl,
  startWebKitAndLoadUrl,
  stopSafari,
  stopWebkit,
} from '../lib/local-tooling/SafariUtils';
import getStableChromeVersions from '../lib/getStableChromeVersions';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const defaultShouldRunDockers = Boolean(JSON.parse(process.env.RUN_DOCKERS ?? 'false'));
const defaultShouldRunLocal = Boolean(JSON.parse(process.env.RUN_LOCAL ?? 'true'));

const baseDomsDir = Path.resolve(BrowserProfiler.profiledDoms, 'local');
const tmpDir = Path.resolve(BrowserProfiler.profiledDoms, '.tmp');
if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true });

export default async function runLocalDoms(
  shouldRunDockers = defaultShouldRunDockers,
  shouldRunLocal = defaultShouldRunLocal,
): Promise<void> {
  const browserEngineOptions = await getStableChromeVersions(10);

  for (const browserEngineOption of browserEngineOptions) {
    const major = String(browserEngineOption.major);
    if (shouldRunDockers) {
      const latestLinux = browserEngineOption.versions.find(x => x.linux);
      const fullVersion = latestLinux.fullVersion;
      await runDockerChromes(fullVersion, major, 1);
      await runDockerChromes(fullVersion, major, 2);
    }
    if (shouldRunLocal) {
      const latest = browserEngineOption.versions.find(x => x.mac);
      const fullVersion = latest.fullVersion;
      await runLocalChromes(fullVersion, major, 1);
      await runLocalChromes(fullVersion, major, 2);
    }
  }

  // cleanup tmp dir
  if (await existsAsync(tmpDir)) await Fs.rm(tmpDir, { recursive: true });
}

// HELPERS

async function runDockerChromes(
  fullVersion: string,
  majorVersion: string,
  i: number,
): Promise<void> {
  const engineName = 'chrome';
  const browserId = createBrowserId(engineName, majorVersion);
  const todoList: { automationType: string; headType: string; folderName: string }[] = [];
  for (const automationType of ['devtools', 'nodevtools']) {
    const headType = 'headless';
    const folderName = createFolderName('linux', browserId, headType, automationType);
    const exists = await localDomsExist(`${baseDomsDir}/${folderName}`, i);
    if (exists) {
      console.log('Found %s (Docker)... SKIPPING', folderName);
    } else {
      todoList.push({ automationType, folderName, headType });
    }
  }
  if (!todoList.length) return;

  console.log('Running Chrome %s on Docker', majorVersion);
  const dockerHost = getDockerHost();
  const dockerChromeUrl = getChromeDownloadUrlForLinux(fullVersion);
  const dockerName = buildChromeDocker(majorVersion, dockerChromeUrl);
  const userAgentId = createUserAgentIdFromIds('linux', browserId);

  for (const { automationType, folderName, headType } of todoList) {
    const tag = createTagName(engineName, majorVersion, headType, automationType, i);
    console.log('------------------------------');
    console.log('Running %s (Local)', folderName);

    const assignment = await createAssignment(tag, userAgentId);
    const urls = extractDomAssignmentUrl(assignment);

    for (const url of urls) {
      const isFinishedPromise = waitUntilDomAssignmentFinishes(assignment, url);
      await startDockerAndLoadUrl(
        dockerName,
        dockerHost,
        url,
        automationType,
        Config.runner.assignmentsHost?.includes('//localhost'),
      );
      await isFinishedPromise;
      stopDocker(dockerName);
      await new Promise(resolve => setTimeout(resolve, 5e3));
    }

    await saveDomAssignmentOutput(userAgentId, assignment);
  }
}

async function localDomsExist(folder: string, i: number): Promise<boolean> {
  if (!(await existsAsync(folder))) return false;
  return (await Fs.readdir(folder)).length >= i * 2;
}

async function runLocalChromes(
  fullVersion: string,
  majorVersion: string,
  i: number,
): Promise<void> {
  const engineName = 'chrome';
  const browserId = createBrowserId(engineName, majorVersion);
  const osId = getLocalOsId();
  const userAgentId = createUserAgentIdFromIds(osId, browserId);
  const todoList: { automationType: string; headType: string; folderName: string }[] = [];
  for (const headType of ['headless', 'headed']) {
    for (const automationType of ['devtools', 'nodevtools']) {
      const folderName = createFolderName(osId, browserId, headType, automationType);
      const exists = await localDomsExist(`${baseDomsDir}/${folderName}`, i);
      if (exists) {
        console.log('Found %s (Local)... SKIPPING', folderName);
      } else {
        todoList.push({ automationType, folderName, headType });
      }
    }
  }
  if (!todoList.length) return;

  await installChrome(fullVersion);
  const executablePath = await getChromeExecutablePath(fullVersion);
  console.log('USING ', executablePath);

  for (const { headType, automationType, folderName } of todoList) {
    const tag = createTagName(engineName, majorVersion, headType, automationType, i);
    console.log('Running %s (Local)', folderName);

    const assignment = await createAssignment(tag, userAgentId);
    const urls = extractDomAssignmentUrl(assignment);
    for (const url of urls) {
      const isFinishedPromise = waitUntilDomAssignmentFinishes(assignment, url);
      await startChromeAndLoadUrl(executablePath, url, headType, automationType);
      await isFinishedPromise;
      await stopChrome();
    }

    await saveDomAssignmentOutput(userAgentId, assignment);
  }
}

function createTagName(
  engine: string,
  majorVersion: string,
  headType: string,
  automationType: string,
  i: number,
): string {
  return `${engine}--${headType}-${automationType}--${i}`;
}

function createBrowserId(engine: string, majorVersion: string): string {
  return `${engine}-${majorVersion}-0`;
}

function createFolderName(
  osId: string,
  browserId: string,
  headType: string,
  automationType: string,
): string {
  return `${osId}--${browserId}--${headType}-${automationType}`;
}

function getLocalOsId(): string {
  const osMeta = getLocalOperatingSystemMeta();
  return `${osMeta.name}-${osMeta.version}`;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function runLocalSafaris(majorVersion: string, i: number): Promise<void> {
  const browserId = createBrowserId('safari', majorVersion);
  const osId = getLocalOsId();
  const userAgentId = createUserAgentIdFromIds(osId, browserId);
  for (const engine of ['safari', 'webkit']) {
    const tag = `${engine}--headed--${i}`;
    const assignment = await createAssignment(tag, userAgentId);

    const urls = extractDomAssignmentUrl(assignment);
    for (const url of urls) {
      const isFinishedPromise = waitUntilDomAssignmentFinishes(assignment, url);
      if (engine === 'safari') {
        await startSafariAndLoadUrl(url);
      } else {
        await startWebKitAndLoadUrl(url);
      }
      await isFinishedPromise;
      if (engine === 'safari') {
        await stopSafari();
      } else {
        await stopWebkit();
      }
    }

    await saveDomAssignmentOutput(userAgentId, assignment);
  }
}

async function createAssignment(tag: string, userAgentId: string): Promise<IAssignment> {
  return await new AssignmentsClient(tag).createSingleUserAgentIdAssignment(userAgentId);
}

function extractDomAssignmentUrl(assignment: IAssignment): string[] {
  return assignment.pagesByPlugin['browser-dom-environment'].map(p => p.url);
}

async function waitUntilDomAssignmentFinishes(assignment: IAssignment, url: string): Promise<void> {
  const waitUntilFinishedUrl = url.replace('/?', '/wait-until-finished?');
  console.log('waitUntilDomAssignmentFinishes: ', url);
  await Axios.get(waitUntilFinishedUrl);
}

async function saveDomAssignmentOutput(
  userAgentId: string,
  assignment: IAssignment,
): Promise<void> {
  const tmpFilesDir = await saveAssignmentToProfileDir(assignment, tmpDir);
  const tmpFileNames = await Fs.readdir(tmpFilesDir);
  const [name, features, i] = assignment.id.split('--');
  const filesDirName = `${userAgentId.replace('chrome', name).replace('-headless', '')}--${
    features || 'none'
  }`;
  const filesDir = Path.join(baseDomsDir, filesDirName);
  if (!(await existsAsync(filesDir))) await Fs.mkdir(filesDir, { recursive: true });

  for (const tmpFileName of tmpFileNames) {
    const newFileName = tmpFileName.replace('.json.gz', `--${i}.json.gz`);
    await Fs.rename(`${tmpFilesDir}/${tmpFileName}`, `${filesDir}/${newFileName}`);
  }
  await Fs.rm(tmpFilesDir, { recursive: true });
  console.log(`SAVED ${assignment.id} -> ${userAgentId}`);
}
