import { z } from 'zod';

export const addressValidation = z
  .string()
  .length(61)
  .regex(
    /^ar1[ac-hj-np-z02-9]{58}/,
    'This is not an Argon address (Bech32 encoded, starting with "ar1").',
  );

export const identityValidation = z
  .string()
  .length(61)
  .regex(
    /^id1[ac-hj-np-z02-9]{58}/,
    'This is not a Ulixee identity (Bech32 encoded hash starting with "id1").',
  );

export const giftCardIdValidation = z.string().length(12);

export const giftCardRemptionKeyValidation = z
  .string()
  .length(62)
  .regex(
    /^gft1[ac-hj-np-z02-9]{58}/,
    'This is not a Ulixee gift card redemption key (Bech32 encoded hash starting with "gft1").',
  );

export const hashValidation = z
  .instanceof(Buffer)
  .refine(x => x.length === 32, { message: 'Hashes must be 32 bytes' });

export const isHex = /^(0x|0h)?[0-9A-F]+$/i;

export const signatureValidation = z
  .instanceof(Buffer)
  .refine(x => x.length === 64, { message: 'Signatures must be 64 bytes' });

export const blockHeightValidation = z.number().int().nonnegative();

export const micronoteIdValidation = z
  .string()
  .length(62)
  .regex(
    /^mcr1[ac-hj-np-z02-9]{58}/,
    'This is not a Micronote id (Bech32 encoded, starting with "mcr").',
  );

export const centagonTokenValidation = z.bigint().refine(x => x > 0n);

export const micronoteTokenValidation = z.number().int().positive();

export const databoxVersionHashValidation = z
  .string()
  .length(62)
  .regex(
    /^dbx1[ac-hj-np-z02-9]{58}/,
    'This is not a Databox versionHash (Bech32 encoded hash starting with "dbx1").',
  );
