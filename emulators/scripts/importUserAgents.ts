import gunzipData from './gunzip-data';
import path from 'path';
import { lookup } from 'useragent';

const inputFilename = require.resolve('user-agents/src/user-agents.json.gz');
const outputFilename = path.resolve(__dirname, '../data/user-agents.json');

gunzipData(inputFilename, outputFilename, entry => {
  if (entry.deviceCategory !== 'desktop' || entry.platform.startsWith('Linux')) {
    return false;
  }
  const agent = lookup(entry.userAgent);
  const os = agent.os.family;
  if (agent.family === 'Chrome') {
    if (os === 'Windows' && entry.platform !== 'Win32') {
      console.log('Filtering bad record', entry);
      return false;
    }
    if (os === 'Mac OS X' && entry.platform !== 'MacIntel') {
      console.log('Filtering bad record', entry);
      return false;
    }
  }
  if (agent.family === 'Safari' && entry.platform !== 'MacIntel') {
    console.log('Filtering bad record', entry);
  }
  return true;
});
