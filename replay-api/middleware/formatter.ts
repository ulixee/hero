import { UserError } from '../lib/Errors';

// tried to follow https://labs.omniti.com/labs/jsend, except for failure/error status
const FAILURE = 'failure';
const SUCCESS = 'success';
const COREFAULT = 'corefault';

////////////////////////////////////////////////////////////////////////////////////////

export default async function formatter(ctx, next) {
  await next();
  transformResponse(ctx).catch(error => {
    console.log('UNCAUGHT ERROR', error);
  });
}

async function transformResponse(ctx) {
  const body: any = {};
  const err = ctx.rawError;
  if (err instanceof UserError) {
    const data = { ...err };
    if (data.extra) Object.assign(data, data.extra);
    if (data.message === data.title) delete data.message;
    delete data.name;
    delete data.extra;
    body.status = FAILURE;
    body.data = data;
  } else if (err) {
    body.status = COREFAULT;
    body.data = { message: 'There as been an internal server error.' };
    // if (err.message) body.message = err.message = err.message.replace(new RegExp('Error: ', 'ig'), '')
    print(err);
  } else {
    body.status = SUCCESS;
    body.data = ctx.response.body;
  }
  if (ctx.response.status === 404 && !ctx.rawError) return;

  ctx.response.status = 200;
  if (typeof body.data === 'string') {
    ctx.response.body = body.data;
  } else if (Buffer.isBuffer(body.data)) {
    ctx.response.body = body.data;
    ctx.response.set('Content-Transfer', 'Encoding: binary');
  } else {
    ctx.response.body = body;
  }
}

function print(err) {
  // if (process.env.ENVIRONMENT == 'test') return;
  let msg = `= ${
    err.name ? err.name.toUpperCase() : 'UNKNOWN ERROR'
  } =============================================================\n`;
  msg += `${err.message}\n`;
  msg += `Stack: ${err.stack ? err.stack.replace(/^[^\n]*/, '') : 'MISSING STACK TRACE'}\n`;
  console.log(msg);
}
