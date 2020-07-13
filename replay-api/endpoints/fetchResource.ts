import SessionDb from '@secret-agent/session-state/lib/SessionDb';
import SessionLoader from '../lib/SessionLoader';
import IContext from '../interfaces/IContext';
import ResourceType from '@secret-agent/core-interfaces/ResourceType';

const readonlyAndFileMustExist = { readonly: true, fileMustExist: true };

const resourceWhitelist: ResourceType[] = ['Ico', 'Image', 'Media', 'Font', 'Stylesheet'];

export default async function fetchResource(ctx: IContext) {
  const { dataLocation, sessionId, commandId, url } = ctx.query;

  const sessionDb = new SessionDb(dataLocation, sessionId, readonlyAndFileMustExist);
  const sessionLoader = new SessionLoader(sessionDb);

  console.log('Fetching resource', url);

  const resource = await sessionLoader.fetchResource(url, commandId);
  if (resource) {
    const { data, headers } = resource;
    ctx.response.type = headers['Content-Type'];
    if (!resourceWhitelist.includes(resource.type)) {
      return `
(function() { 
  let script = "Blocked for Replay";
})();`;
    }
    return data;
  }
}
