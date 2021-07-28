import sessionCommandsApi, { ISessionCommandsApi } from './Session.commands';
import sessionDomChangesApi, { ISessionDomChangesApi } from './Session.domChanges';
import sessionInteractionsApi, { ISessionInteractionsApi } from './Session.interactions';
import sessionResourceApi, { ISessionResourceApi } from './Session.resource';
import sessionResourcesApi, { ISessionResourcesApi } from './Session.resources';
import sessionTabsApi, { ISessionTabsApi } from './Session.tabs';
import sessionTicksApi, { ISessionTicksApi } from './Session.ticks';
import sessionFindApi, { ISessionFindApi } from './Session.find';
import sessionsFindRelatedApi, { ISessionsFindRelatedApi } from './Sessions.findRelated';
import sessionsFindWithErrorsApi, { ISessionsFindWithErrorsApi } from './Sessions.findWithErrors';
import sessionsSearchApi, { ISessionsSearchApi } from './Sessions.search';

// README:
// This wiring makes sure the args/result match the api definitions
// Errors in apiHandlers probably mean you have a misaligned definition in your api, or you need to add your api to IApis
type ApiHandlers = {
  [key in keyof IApis]: (args: IApis[key]['args']) => IApis[key]['result'];
};

const apiHandlers: ApiHandlers = {
  'Session.commands': sessionCommandsApi,
  'Session.domChanges': sessionDomChangesApi,
  'Session.interactions': sessionInteractionsApi,
  'Session.find': sessionFindApi,
  'Session.resource': sessionResourceApi,
  'Session.resources': sessionResourcesApi,
  'Session.tabs': sessionTabsApi,
  'Session.ticks': sessionTicksApi,
  'Sessions.findRelated': sessionsFindRelatedApi,
  'Sessions.findWithErrors': sessionsFindWithErrorsApi,
  'Sessions.search': sessionsSearchApi,
};

export { apiHandlers };

export interface IApis {
  'Session.commands': ISessionCommandsApi;
  'Session.domChanges': ISessionDomChangesApi;
  'Session.find': ISessionFindApi;
  'Session.interactions': ISessionInteractionsApi;
  'Session.resource': ISessionResourceApi;
  'Session.resources': ISessionResourcesApi;
  'Session.tabs': ISessionTabsApi;
  'Session.ticks': ISessionTicksApi;
  'Sessions.findRelated': ISessionsFindRelatedApi;
  'Sessions.findWithErrors': ISessionsFindWithErrorsApi;
  'Sessions.search': ISessionsSearchApi;
}

export interface ICoreApiRequest<T extends keyof IApis> {
  api: T;
  messageId: string;
  args: IApis[T]['args'];
}

export interface ICoreApiResponse<T extends keyof IApis> {
  responseId: string;
  result: IApis[T]['result'];
}
