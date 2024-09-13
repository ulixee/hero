import { ChildProcess, execSync, spawn } from 'child_process';
import { URL } from 'url';
import * as Path from 'path';
import { navigateDevtoolsToUrl } from './ChromeUtils';

const dockerWorkingDirectory = Path.resolve(__dirname, `../../chrome-docker`);

export function buildChromeDocker(version: string, chromeUrl: string): string {
  const dockerName = `chromes-${version}`;
  console.log(chromeUrl);
  const chromeFolder = chromeUrl.match(/chrome_(.+)_linux.tar.gz$/)[1];
  const dockerArgs = [
    `--build-arg chrome_url="${chromeUrl}"`,
    `--build-arg chrome_folder="${chromeFolder}"`,
    '-f "Dockerfile-linux"',
    `-t "${dockerName}"`,
  ];
  if (process.platform === 'darwin') {
    dockerArgs.push('--platform=linux/amd64');
  }
  const command = `docker build ${dockerArgs.join(' ')} .`;
  console.log(command);
  execSync(command, { stdio: 'inherit', cwd: dockerWorkingDirectory });
  return dockerName;
}

export function getDockerHost(): string {
  const dockerHost = execSync(
    `docker run --rm node:12-slim getent hosts host.docker.internal | awk '{ print $1 }'`,
    { cwd: dockerWorkingDirectory },
  )
    .toString()
    .trim();
  console.log(`Local docker internal ip is ${dockerHost}`);
  return dockerHost;
}
let counter = 0;
export async function startDockerAndLoadUrl(
  dockerName: string,
  dockerHost: string,
  url: string,
  automationType: string,
  needsLocalHost: boolean,
  chromeVersion: number,
): Promise<ChildProcess> {
  const { hostname } = new URL(url);
  // TODO should we also run this with remote-debugging-pipe, as there migth be differences
  // between pipe and port debugging?
  const hasDevtools = automationType === 'devtools';
  const dockerArgs = [
    '--init',
    `--name=${dockerName}`,
    '--rm',
    '--privileged',
    '--ipc=host',
    '--shm-size="3gb"',
    '--cap-add=SYS_ADMIN',
  ];

  const chromeArgs = [
    '--allow-running-insecure-content',
    '--ignore-certificate-errors',
    '--incognito',
    '--use-mock-keychain',
    `--user-data-dir=/tmp/${Date.now()}-${(counter += 1)}`,
  ];

  if (chromeVersion >= 111) {
    chromeArgs.push('--headless=new');
  } else {
    chromeArgs.push('--headless');
  }
  if (hasDevtools) {
    chromeArgs.push('--remote-debugging-address=0.0.0.0', '--remote-debugging-port=9222');
    dockerArgs.push('-p=9222:9222');
  }
  if (process.platform === 'darwin') {
    dockerArgs.push('--platform=linux/amd64');
  }
  if (needsLocalHost) {
    dockerArgs.push(`--add-host="${hostname}:${dockerHost}"`);
  }

  const urlArg = hasDevtools ? 'about:blank' : url;
  const command = `docker run ${dockerArgs.join(' ')} ${dockerName} "${chromeArgs.join(' ')}" "${urlArg}"`;

  console.log(command);
  const child = spawn(command, { shell: true, stdio: 'pipe', cwd: dockerWorkingDirectory });

  process.on('exit', () => stopDocker(dockerName));
  process.on('SIGTERM', () => stopDocker(dockerName));
  child.stderr.setEncoding('utf8');
  child.stdout.setEncoding('utf8');
  child.stderr.pipe(process.stderr);
  child.stdout.pipe(process.stdout);

  if (hasDevtools) {
    await new Promise<void>(resolve => {
      child.stderr.on('data', msg => {
        if (msg.includes('listening')) resolve();
      });
      child.stdout.on('data', msg => {
        if (msg.includes('listening')) resolve();
      });
    });
    await new Promise(resolve => setTimeout(resolve, 1e3));
    await navigateDevtoolsToUrl(url, 9222);
  }

  return child;
}

export function stopDocker(dockerName: string): void {
  console.log(`STOPPING ${dockerName}`);
  execSync(`docker stop ${dockerName} || true`);
}
