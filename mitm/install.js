const { execSync } = require('child_process');
const https = require('https');
const fs = require('fs');
const os = require('os');
const { createHash } = require('crypto');
const { gunzipSync } = require('zlib');
const packageJson = require('./package');

const outDir = `${__dirname}/socket`;
const { version } = packageJson;
const releasesAssetsUrl = `https://github.com/ulixee/secret-agent/releases/download/v${version}/`;

(async function install() {
  let programName = 'connect';
  const filename = buildFilename(version);
  if (os.platform() === 'win32') {
    programName += '.exe';
  }

  const installed = getInstalledVersion();
  if (installed && installed.startsWith(version) && isBinaryInstalled(programName)) {
    console.log('Latest SecretAgent connect library already installed');
    return;
  }

  const checksum = await getSourceChecksum(filename);
  const filepath = `${releasesAssetsUrl}/${filename}`;
  
  if (!checksum) {
    if (tryBuild()) {
      saveVersion(version, checksum);
      console.log('Successfully compiled Secret Agent connect library');
      process.exit();
      return;
    }
    
    const filepath = `${releasesAssetsUrl}/${filename}`;
    const goVersionNeeded = getGoVersionNeeded();
    console.log(
      `The architecture file you need for the Secret Agent connect library is not available (${filepath}).\n\n
You can install golang ${goVersionNeeded} (https://golang.org/) and run "go build" from the mitm/socket directory`,
    );
    process.exit(1);
  }

  console.log('Downloading Secret Agent connect library from %s (checksum=%s)', filepath, checksum);
  const zippedFile = await download(filepath);

  const downloadedChecksum = getFileChecksum(zippedFile);
  if (downloadedChecksum !== checksum) {
    console.log('WARN!! Checksum mismatch for the Secret Agent connect library', {
      checksum,
      downloadedChecksum,
    });
    process.exit(1);
  }

  const file = gunzipSync(zippedFile);

  fs.writeFileSync(`${__dirname}/socket/${programName}`, file);
  fs.chmodSync(`${__dirname}/socket/${programName}`, 0o755);
  saveVersion(version, checksum);
  console.log('Successfully downloaded');
})();

function tryBuild() {
  const goVersionNeeded = getGoVersionNeeded();
  const isGoInstalled = isGoVersionInstalled(goVersionNeeded);
  console.log('Is go installed? %s, %s', goVersionNeeded, isGoInstalled);

  if (isGoInstalled) {
    return compile();
  }
  return false;
}

function getInstalledVersion() {
  if (fs.existsSync(`${outDir}/.version`)) {
    return fs.readFileSync(`${outDir}/.version`, 'utf8');
  }
  return null;
}

function isBinaryInstalled(programName) {
  return fs.existsSync(`${outDir}/${programName}`);
}

function saveVersion(version, checksum) {
  fs.writeFileSync(`${outDir}/.version`, `${version}=${checksum}`);
}

function buildFilename(version) {
  let platform = os.platform();
  let arch = os.arch();
  if (arch === 'x64') arch = 'x86_64';
  if (arch === 'ia32') arch = '386';

  if (platform === 'win32') {
    platform = 'win';
  }
  if (platform === 'darwin') {
    platform = 'mac';
  }

  return `connect_${version}_${platform}_${arch}.gz`;
}

async function download(filepath) {
  return new Promise((resolve, reject) => {
    const req = https.get(filepath, async res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location)
          .then(resolve)
          .catch(reject);
      }

      try {
        const buffer = [];
        for await (const chunk of res) {
          buffer.push(chunk);
        }
        const output = Buffer.concat(buffer);
        resolve(output);
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', err => {
      console.log('ERROR downloading needed Secret Agent library %s', filepath, err);
      reject(err);
    });
  });
}

function getFileChecksum(file) {
  return createHash('sha256')
    .update(file)
    .digest()
    .toString('hex');
}

async function getSourceChecksum(filename) {
  const buffer = await download(`${releasesAssetsUrl}/default.checksum`);

  const checksum = buffer.toString('utf8');

  const match = checksum.split(/\r?\n/).find(x => x.endsWith(filename));

  const expectedChecksum = match ? match.split(/\s+/).shift() : undefined;

  if (!expectedChecksum) {
    throw new Error('Invalid checksum found for Secret Agent socket library');
  }

  return expectedChecksum;
}

function compile() {
  try {
    execSync('go build', { cwd: `${__dirname}/socket` });
    return true;
  } catch (err) {
    console.log(
      'Error compiling Secret Agent socket connect library.\n\nWill download instead.',
      err.message,
    );
    return false;
  }
}

function getGoVersionNeeded() {
  const goMod = fs.readFileSync(`${__dirname}/socket/go.mod`, 'utf8');
  const goMatch = goMod.match(/go ([\d.]+)/);
  return goMatch[1];
}

function isGoVersionInstalled(wantedVersion) {
  const goVersionNeeded = wantedVersion.split('.');
  try {
    const goVersion = execSync('go version', { encoding: 'utf8' });
    const version = goVersion.match(/go version go([\d.]+)\s\w+\/\w+/);
    if (!version || !version.length) return false;
    if (version && version.length) {
      const versionParts = version[1].split('.');
      if (versionParts[0] !== goVersionNeeded[0]) return false;
      if (parseInt(versionParts[1]) < parseInt(goVersionNeeded[1])) return false;
      return true;
    }
  } catch (err) {
    return false;
  }
}
