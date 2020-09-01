import 'source-map-support/register';
import Core from '@secret-agent/core';
import { SecretAgentClientGenerator } from '@secret-agent/client';
import ISessionMeta from '@secret-agent/core-interfaces/ISessionMeta';

process.title = 'SecretAgent';

// tslint:disable:variable-name
const { SecretAgent, coreClient } = SecretAgentClientGenerator();

// OUTGOING ////////////////////////////////////////////////////////////////////

coreClient.pipeOutgoingCommand = async (
  sessionMeta: ISessionMeta | null,
  command: string,
  args: any[],
) => {
  if (sessionMeta) {
    const core = Core.byTabId[sessionMeta.tabId];
    const data = await core[command](...args);
    const commandId = core.lastCommandId;
    return { data, commandId };
  }
  return { data: await Core[command](...args) };
};

// INCOMING ////////////////////////////////////////////////////////////////////

Core.onEventFn = (meta: ISessionMeta, listenerId: string, ...args: any[]) => {
  coreClient.pipeIncomingEvent(meta, listenerId, args);
};

// EXPORT SecretAgent //////////////////////////////////////////////////////////

export = SecretAgent;
