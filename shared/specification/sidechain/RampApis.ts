import { z } from 'zod';
import { IZodSchemaToApiTypes } from '../utils/IZodApi';
import { addressValidation } from '../common';

export const RampApiSchemas = {
  'Ramp.audit': {
    args: z.undefined().nullish(),
    result: z.object({
      auditDate: z.date(),
      usdcToArgonConversionRate: z.number(),
      argonsInCirculation_e6: z
        .bigint()
        .describe(
          'Argons converted to 6 decimals to match USDC reserves. Amount should NOT exceed USDC reserves adjusted by conversion rate.',
        ),
      usdcReserves_e6: z.bigint().describe('Total reserves balance in USDC raw value.'),
      usdcReserveAddresses: z
        .object({
          blockchain: z.string().describe('Blockchain where USDC is held (eg, ethereum, polygon, etc).'),
          blockchainNetwork: z.string().describe('Blockchain network for the given chain (eg, homestead, ropsten, etc).'),
          address: z.string().describe('USDC address of reserves.'),
          ownershipProof: z
            .string()
            .describe('Signature proving ownership of holdings as of Audit Date.'),
        })
        .array(),
    }),
  },
  'Ramp.createTransferInAddress': {
    args: z.object({
      blockchain: z.enum(['ethereum', 'polygon']),
      address: addressValidation,
    }),
    result: z.object({
      blockchainNetwork: z.string(),
      address: z.string().describe('Address on the given network.'),
      expirationDate: z
        .date()
        .describe('Valid through date. Funds sent after this date will be lost.'),
    }),
  },
};

type IRampApis = IZodSchemaToApiTypes<typeof RampApiSchemas>;
export default IRampApis;
