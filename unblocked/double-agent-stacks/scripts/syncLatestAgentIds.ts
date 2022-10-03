import '@ulixee/commons/lib/SourceMapSupport';
import * as stableChromeVersions from '@unblocked-web/real-user-agents/data/stableChromeVersions.json';
import IUserAgentConfig from '@double-agent/runner/interfaces/IUserAgentConfig';
import * as Fs from 'fs';
import { getExternalDataPath } from '../paths';

const agents: IUserAgentConfig = {
  browserIds: stableChromeVersions.slice(0, 2).map(x => x.id),
};

Fs.writeFileSync(getExternalDataPath('userAgentConfig.json'), JSON.stringify(agents, null, 2));
