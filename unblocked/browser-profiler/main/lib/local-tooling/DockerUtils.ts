import { ChildProcess, execSync, spawn } from 'child_process';
import { URL } from 'url';
import * as Path from 'path';
import { navigateDevtoolsToUrl } from './ChromeUtils';

const dockerWorkingDirectory = Path.resolve(__dirname, `../../chrome-docker`);

export function buildChromeDocker(version: string, chromeUrl: string): string {
  const dockerName = `chromes-${version}`;
  console.log(chromeUrl);
  const chromeFolder = chromeUrl.match(/chrome_(.+)_linux.tar.gz$/)[1];
  const command = `docker build --build-arg chrome_url="${chromeUrl}" --build-arg chrome_folder="${chromeFolder}" -f "Dockerfile-linux" -t "${dockerName}" .`;
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
  const hasDevtools = automationType === 'devtools';
  const dockerArgs = hasDevtools ? `-p=9222:9222` : '';
  counter += 1;
  const chromeArgs = [
    '--allow-running-insecure-content',
    '--ignore-certificate-errors',
    '--headless',
    '--incognito',
    `--user-data-dir=/tmp/${Date.now()}-${(counter += 1)}`,
  ];
  if (chromeVersion >= 109) {
    // NOTE: not working on docker.
    //   chromeArgs.push('--headless=new');
    // } else if (chromeVersion >= 96) {
    //   chromeArgs.push('--headless=chrome');
    // } else {
    //   chromeArgs.push('--headless');
  }
  // regular headless isn't launching without new
  if (chromeVersion >= 111 && !hasDevtools) {
    chromeArgs[2] = '--headless=new';
  }
  if (hasDevtools) {
    chromeArgs.push('--remote-debugging-address=0.0.0.0', '--remote-debugging-port=9222');
  }

  const hostArg = needsLocalHost ? `--add-host="${hostname}:${dockerHost}"` : '';
  const urlArg = hasDevtools ? 'about:blank' : url;
  const command = `docker run --init --rm --name ${dockerName} --security-opt seccomp="./Docker-chrome.json" --ipc=host --shm-size='3gb' --cap-add=SYS_ADMIN ${hostArg} ${dockerArgs} ${dockerName} "${chromeArgs.join(
    ' ',
  )}" "${urlArg}"`;

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
