process.env.ENVIRONMENT = process.env.ENVIRONMENT || 'development';

import Koa from 'koa';
import Router from 'koa-router';
import cors from '@koa/cors';

import middleware from './middleware';
import endpoints from './endpoints';

////////////////////////////////////////////////////////////////////////////////////////

const koa = middleware(new Koa());
const router = new Router();

const isTest = process.env.ENVIRONMENT === 'test';

// ////////////////////////////////////////////////////////////////////////////////////////

router.get('/sessionMeta', endpoints.fetchSessionMeta);
router.get('/resource', endpoints.fetchResource);

// ////////////////////////////////////////////////////////////////////////////////////////

koa.use(cors());
koa.use((ctx, next) => {
  if (!isTest && ctx.method !== 'OPTIONS') {
    // tslint:disable-next-line:no-console
    console.log(`${ctx.method.padEnd(7)} -> ${ctx.path}`);
  }
  return next();
});

koa.use(router.routes());
koa.use(async (ctx, next) => {
  ctx.status = 404;
  ctx.body = 'Not Found';
  // tslint:disable-next-line:no-console
  if (!isTest) console.log(`${ctx.method.padEnd(7)} -> ${ctx.path} (404 MISSING)`);
  next();
});

////////////////////////////////////////////////////////////////////////////////////////

export default koa;
