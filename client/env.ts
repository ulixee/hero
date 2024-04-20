import { loadEnv, parseEnvPath } from '@ulixee/commons/lib/envUtils';
import * as Path from 'path';

loadEnv(Path.join(__dirname, '..', 'core'));
loadEnv(Path.join(__dirname, '..', 'hero-core'));

const env = process.env;

if (env.ULX_DATA_DIR) env.ULX_DATA_DIR = parseEnvPath(env.ULX_DATA_DIR);
