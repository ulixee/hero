import { IApiSpec } from '@ulixee/net/interfaces/IApiHandlers';
import ICoreRequestPayload from '@ulixee/net/interfaces/ICoreRequestPayload';
import ICoreResponsePayload from '@ulixee/net/interfaces/ICoreResponsePayload';
import sessionCommandsApi from './Session.commands';
import sessionDomChangesApi from './Session.domChanges';
import sessionInteractionsApi from './Session.interactions';
import sessionResourceApi from './Session.resource';
import sessionResourcesApi from './Session.resources';
import sessionTabsApi from './Session.tabs';
import sessionTicksApi from './Session.ticks';
import sessionFindApi from './Session.find';
import sessionsFindRelatedApi from './Sessions.findRelated';
import sessionsFindWithErrorsApi from './Sessions.findWithErrors';
import sessionsSearchApi from './Sessions.search';

const heroApiHandlers = {
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

type IHeroCoreApiHandlers = typeof heroApiHandlers;
type IHeroCoreApiSpec = IApiSpec<IHeroCoreApiHandlers>;

type IHeroApiRequest<T extends keyof IHeroCoreApiHandlers> = ICoreRequestPayload<
  IHeroCoreApiHandlers,
  T
>;
type IHeroApiResponse<T extends keyof IHeroCoreApiHandlers> = ICoreResponsePayload<
  IHeroCoreApiHandlers,
  T
>;

export { heroApiHandlers, IHeroCoreApiSpec, IHeroCoreApiHandlers, IHeroApiResponse, IHeroApiRequest };
