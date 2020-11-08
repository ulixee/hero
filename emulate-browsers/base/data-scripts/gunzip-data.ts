import fs from 'fs';
import { gunzipSync } from 'zlib';

const gunzipData = (inputFilename, outputFilename, filter) => {
  if (!inputFilename || !inputFilename.endsWith('.gz')) {
    throw new Error('Filename must be specified and end with `.gz` for gunzipping.');
  }
  outputFilename = outputFilename || inputFilename.slice(0, -3);
  const compressedData = fs.readFileSync(inputFilename);
  const data = JSON.parse(gunzipSync(compressedData).toString('utf8'));

  fs.writeFileSync(outputFilename, JSON.stringify(data.filter(filter), null, 2));
};

export default gunzipData;
