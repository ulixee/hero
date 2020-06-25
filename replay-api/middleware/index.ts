export default function Middleware(koa) {
  koa.use(require('./formatter').default);
  koa.use(require('./validator').default);
  return koa;
}
