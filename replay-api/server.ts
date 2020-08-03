// tslint:disable:no-console
process.env.ENVIRONMENT = process.env.ENVIRONMENT || 'development';

import http from 'http';
import fetchResource from './endpoints/fetchResource';
import fetchSessionMeta from './endpoints/fetchSessionMeta';

const isTest = process.env.ENVIRONMENT === 'test';

export default async (req: http.IncomingMessage, res: http.ServerResponse) => {
  if (!isTest && req.method !== 'OPTIONS') {
    console.log(`${req.method.padEnd(7)} -> ${req.url}`);
  }
  try {
    if (req.url.match(/\/sessionMeta/)) {
      return await fetchSessionMeta(req, res);
    }

    if (req.url.match(/\/resource/)) {
      return await fetchResource(req, res);
    }

    res.writeHead(404);
    res.end('Not Found');
    if (!isTest) console.log(`${req.method.padEnd(7)} -> ${req.url} (404 MISSING)`);
  } catch (error) {
    res.writeHead(500, {
      'content-type': 'application/json',
    });
    res.end(JSON.stringify({ message: 'There as been an internal server error.', error }));
    if (!isTest) console.log(`${req.method.padEnd(7)} -> ${req.url} (500 ${error.stack})`);
  }
};
