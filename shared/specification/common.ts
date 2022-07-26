import { z } from 'zod';

export const addressValidation = z
  .string()
  .length(61)
  .regex(/^ar1[ac-hj-np-z02-9]{58}/) // no 1 b i o
  .refine(x => x.startsWith('ar'), { message: 'This is not an Argon address.' });

export const hashValidation = z
  .instanceof(Buffer)
  .refine(x => x.length === 32, { message: 'Hashes must be 32 bytes' });

export const publicKeyValidation = z
  .instanceof(Buffer)
  .refine(x => x.length === 32, { message: 'Public keys must be 32 bytes' });

export const isHex = /^(0x|0h)?[0-9A-F]+$/i;

export const signatureValidation = z
  .instanceof(Buffer)
  .refine(x => x.length === 64, { message: 'Signatures must be 64 bytes' });

export const blockHeightValidation = z.number().int().nonnegative();

export const micronoteBatchSlugValidation = z.string().regex(isHex).length(10);

export const micronoteIdValidation = z
  .instanceof(Buffer)
  .refine(x => x.length === 32, { message: 'Micronote ids must be 32 bytes' });

export const centagonTokenValidation = z.bigint().refine(x => x > 0n);

export const nodeIdValidation = z.string().length(32);

export const micronoteTokenValidation = z.number().int().positive();
