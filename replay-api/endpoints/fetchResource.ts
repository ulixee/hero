import SessionDb from '@secret-agent/session-state/lib/SessionDb';
import ResourceType from '@secret-agent/core-interfaces/ResourceType';
import { IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';

const readonlyAndFileMustExist = { readonly: true, fileMustExist: true };

const resourceWhitelist: ResourceType[] = ['Ico', 'Image', 'Media', 'Font', 'Stylesheet'];

export default async function fetchResource(req: IncomingMessage, res: ServerResponse) {
  const reqUrl = parse(req.headers.host + req.url, true);
  const { dataLocation, sessionId, url } = reqUrl.query;

  const sessionDb = new SessionDb(
    dataLocation as string,
    sessionId as string,
    readonlyAndFileMustExist,
  );

  console.log('Replay API: Fetching resource', url);

  const resource = await sessionDb.resources.getResourceByUrl(url as string, false);
  if (!resource) {
    res.writeHead(404);
    res.end('Resource not found');
    return;
  }
  if (!resource.type) {
    res.writeHead(400);
    res.end('Resource not loaded');
    return;
  }

  if (resource.type === 'Document') {
    res.writeHead(200, {
      'Cache-Control': 'public, max-age=500',
      'Content-Type': resource.headers['Content-Type'] ?? resource.headers['content-type'],
      'Content-Security-Policy':
        "default-src *; navigate-to 'none'; style-src 'self' http://* https://* 'unsafe-inline'; script-src 'self' http://* https://*; font-src 'self' https://* data:;",
    });
    res.end(`<html><head></head><body></body></html>`);
    return;
  }

  if (!resourceWhitelist.includes(resource.type)) {
    res.writeHead(200, {
      'Cache-Control': 'public, max-age=500',
      'Content-Type': resource.headers['Content-Type'] ?? resource.headers['content-type'],
    });

    if (resource.type === 'Script') {
      res.end(mockScript);
    } else {
      res.end();
    }

    return;
  }

  res.writeHead(200, resource.headers);
  res.end(resource.data);
}

const mockScript = `
(function() { 
  let script = "Blocked for Replay";
})();`;
