import { z } from 'zod';
import { IZodSchemaToApiTypes } from '../utils/IZodApi';
import { TransactionSchema } from '../types/ITransaction';
import { LedgerType, TransactionError } from '../index';
import { blockHeightValidation, hashValidation } from '../common';
import { MerkleProofSchema } from '../types/IMerkleProof';

const TransactionResponseSchema = z.object({
  preliminaryBlockHeight: blockHeightValidation,
  error: z.nativeEnum(TransactionError),
  message: z.string().optional(),
});

export const TransactionApiSchemas = {
  'Transaction.created': {
    args: z.object({
      transaction: TransactionSchema,
      ledger: z.nativeEnum(LedgerType),
      nodeIdsAlreadySent: z.string().array(),
    }),
    result: z.object({
      accept: z.boolean(),
      error: z.nativeEnum(TransactionError),
      message: z.string().optional(),
    }),
  },
  'Transaction.transfer': {
    args: z.object({
      transaction: TransactionSchema,
      ledger: z.nativeEnum(LedgerType),
    }),
    result: TransactionResponseSchema,
  },
  'Transaction.claim': {
    args: z.object({
      transaction: TransactionSchema,
    }),
    result: TransactionResponseSchema,
  },
  'Transaction.purchase': {
    args: z.object({
      transaction: TransactionSchema,
    }),
    result: TransactionResponseSchema,
  },
  'Transaction.verifyInBlock': {
    args: z.object({
      transactionHash: hashValidation,
      transactionIndex: z.number().int().nonnegative(),
      blockHeight: blockHeightValidation,
      ledger: z.nativeEnum(LedgerType),
    }),
    result: z.object({
      proofs: MerkleProofSchema.array(),
    }),
  },
  'Transaction.checkForBondRedemption': {
    args: z.object({
      transactionHash: hashValidation,
    }),
    result: z.object({
      transaction: TransactionSchema,
      blockHeight: blockHeightValidation,
    }),
  },
};

type ITransactionApis = IZodSchemaToApiTypes<typeof TransactionApiSchemas>;
export default ITransactionApis;
