import SessionDb from '@secret-agent/session-state/lib/SessionDb';
import SessionLoader from '../lib/SessionLoader';
import IContext from '../interfaces/IContext';
import ResourceType from '@secret-agent/core-interfaces/ResourceType';

const readonlyAndFileMustExist = { readonly: true, fileMustExist: true };

const resourceWhitelist: ResourceType[] = ['Ico', 'Image', 'Media', 'Font', 'Stylesheet'];

export default async function fetchPaintEvents(ctx: IContext) {
  const { dataLocation, sessionId, commandId, url } = ctx.query;

  const sessionDb = new SessionDb(dataLocation, sessionId, readonlyAndFileMustExist);
  const sessionLoader = new SessionLoader(sessionDb);

  const resource = await sessionLoader.fetchResource(url, commandId);
  if (resource) {
    const { data, headers } = resource;
    ctx.response.type = headers['Content-Type'];
    if (!resourceWhitelist.includes(resource.type)) {
      return '';
    }
    return data;
  }
}
