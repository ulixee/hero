import { CustomError } from '../lib/Errors';
import IContextValidate from '../interfaces/IContextValidate';

//////////////////////////////////////////////////////////////////////////////////////////

export default async function validator(ctx, next) {
  ctx.validate = {
    isPresent(...keys: string[]) {
      isPresent(keys, { ...ctx.params, ...ctx.query, ...ctx.request.body });
    },
    hasValue(key: string, values: string[]) {
      hasValue(key, values, { ...ctx.params, ...ctx.query, ...ctx.request.body });
    },
  } as IContextValidate;
  await next();
}

//////////////////////////////////////////////////////////////////////////////////////////

function isPresent(keys, params) {
  const missingKeys = extractMissingKeys(keys, params);
  if (!missingKeys.length) return true;
  throw new CustomError('MissingParams', 'You must provide valid params', {
    missingParams: missingKeys,
  });
}

function hasValue(key, values, params) {
  if (values && Array.isArray(values) && values.includes(params[key])) return true;
  throw new CustomError('InvalidParams', 'You must provide valid params', { invalidParams: key });
}

function extractMissingKeys(keys, params) {
  const missingKeys = [];
  keys.forEach(key => {
    if (params[key] === undefined || params[key] === null) missingKeys.push(key);
  });
  return missingKeys;
}
