const { execSync } = require('child_process');
const https = require('https');
const fs = require('fs');
const os = require('os');
const { createHash } = require('crypto');
const { gunzipSync } = require('zlib');

const fileHost =
  process.env.SA_CONNECT_LIBRARY_HOST || 'https://storage.googleapis.com/secret-agent';

const outDir = `${__dirname}/socket`;

(async function install() {
  let programName = 'connect';
  const filename = buildFilename();
  if (filename.endsWith('.exe.gz')) {
    programName += '.exe';
  }

  const { version, checksum } = getSourceChecksum(filename);

  if (isInstalled(programName, version, checksum)) return;

  const filepath = `${fileHost}/v${version}/${filename}`;

  if (!checksum) {
    if (tryBuild()) {
      saveVersion(version, checksum);
      console.log('Successfully compiled Secret Agent connect library');
      process.exit();
      return;
    }

    console.log(
      `The architecture file you need for the Secret Agent connect library is not available (${filepath}).\n\n
You can install golang ${goVersionNeeded} (https://golang.org/) and run "go build" from the mitm/socket directory`,
    );
    process.exit(1);
  }

  console.log('Downloading Secret Agent connect library from %s (md5=%s)', filepath, checksum);
  const zippedFile = await download(filepath);

  const downloadMd5 = getFileMd5(zippedFile);
  if (downloadMd5 !== checksum) {
    console.log('WARN!! Checksum failed for the Secret Agent connect library', {
      checksum,
      downloadMd5,
    });
    process.exit(1);
  }

  const file = gunzipSync(zippedFile);

  fs.writeFileSync(`${__dirname}/socket/${programName}`, file);
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

function isInstalled(programName, version, checksum) {
  if (fs.existsSync(`${outDir}/${programName}`) && fs.existsSync(`${outDir}/.version`)) {
    const versionFile = fs.readFileSync(`${outDir}/.version`, 'utf8');
    if (versionFile === `${version}=${checksum}`) return true;
  }
  return false;
}

function saveVersion(version, checksum) {
  fs.writeFileSync(`${outDir}/.version`, `${version}=${checksum}`);
}

function buildFilename() {
  let platform = os.platform();
  let arch = os.arch();
  let fileExt = 'gz';
  if (arch === 'x64') {
    arch = 'x86_64';
  }

  if (platform === 'win32') {
    platform = 'windows';
    fileExt = 'exe.gz';
  }

  return `connect_${platform}_${arch}.${fileExt}`;
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
      console.log('ERROR downloading needed Secret Agent connect library', err);
      reject(err);
    });
  });
}

function getFileMd5(file) {
  return createHash('md5')
    .update(file)
    .digest()
    .toString('hex');
}

function getSourceChecksum(filename) {
  const checksum = fs.readFileSync(`${__dirname}/socket/.checksum`, 'utf8');
  const version = checksum.match(/VERSION=(.+)/)[1];

  const match = checksum.split(/\r?\n/).find(x => x.startsWith(filename));

  const expectedMd5 = match ? match.split('=').pop() : undefined;

  if (!expectedMd5) {
    throw new Error('Invalid checksum found for Secret Agent socket library');
  }

  return {
    version,
    checksum: expectedMd5,
  };
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
