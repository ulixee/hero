import '@ulixee/commons/lib/SourceMapSupport';
import extractFoundationalProbes from '@double-agent/runner/lib/extractFoundationalProbes';
import { getExternalDataPath } from '../paths';

const foundationalProfilesDir = getExternalDataPath('/0-foundational-profiles');

extractFoundationalProbes(foundationalProfilesDir).catch(console.log);
