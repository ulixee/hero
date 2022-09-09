import { z } from 'zod';
import { hashValidation, identityValidation } from '../common';
import { ArithmeticEncodingSchema } from './IArithmeticEncoding';

export const DatumSettingsSchema = z.object({
  xoredCandidatesMinimum: z.number().int().nonnegative(),
  secondPingPercent: z.number().int().nonnegative(),
  auditorsCount: z.number().int().nonnegative(),
});

export const ApprovedSidechainSchema = z.object({
  url: z.string(),
  rootIdentity: identityValidation,
});

export const BlockSettingsSchema = z.object({
  xoredCandidateDistance: ArithmeticEncodingSchema,
  datum: DatumSettingsSchema,
  networkNodes: z.number().int().nonnegative(),
  bitSamplingsInBlock: z.number().int().nonnegative(),
  bitSamplingBlockAge: z.number().int().nonnegative(),
  blockHash: hashValidation,
  nextLinkTarget: ArithmeticEncodingSchema,
  height: z.number().int().nonnegative(),
  sidechains: ApprovedSidechainSchema.array(),
  minimumMicronoteBurnPercent: z.number().int().nonnegative(),
});

type IBlockSettings = z.infer<typeof BlockSettingsSchema>;
export default IBlockSettings;
