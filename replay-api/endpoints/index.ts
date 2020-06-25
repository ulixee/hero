import IContext from '../interfaces/IContext';

const endpoints: { [name: string]: (ctx: any, next: any) => any } = {
  fetchSessionMeta: loadEndpoint('fetchSessionMeta'),
  fetchPaintEvents: loadEndpoint('fetchPaintEvents'),
  fetchResource: loadEndpoint('fetchResource'),
};

function loadEndpoint(name) {
  const fn = require(`./${name}`).default;
  return async (ctx: IContext, next: () => any) => {
    try {
      ctx.response.body = await fn(ctx);
    } catch (err) {
      ctx.rawError = err;
    }
  };
}

export default endpoints;
