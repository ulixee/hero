import { z } from 'zod';

export type IZodSchemaToApiTypes<Z extends IZodApiSpec> = {
  [T in keyof Z & string]: IZodCommandSchema<Z, T>;
};

export type IZodCommandSchema<Z extends IZodApiSpec, T extends keyof Z> = {
  command: T;
  args: z.infer<Z[T]['args']>;
  result: z.infer<Z[T]['result']>;
};

export type IZodApiTypes = { args: z.Schema; result: z.Schema };

export type IZodApiSpec = { [command: string]: IZodApiTypes };

export type IZodHandlers<Spec extends IZodApiSpec, TContext = any> = {
  [Api in keyof Spec]: (
    args: z.infer<Spec[Api]['args']>,
    context?: TContext,
  ) => Promise<z.infer<Spec[Api]['result']>>;
};
