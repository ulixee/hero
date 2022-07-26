import { z } from 'zod';

export type IZodSchemaToApiTypes<Z extends IZodApiSpec> = {
  [T in keyof Z]: {
    command: T;
    args: z.infer<Z[T]['args']>;
    result: z.infer<Z[T]['result']>;
  };
};

export type IZodApiTypes = { args: z.Schema; result: z.Schema };

export type IZodApiSpec = { [command: string]: IZodApiTypes };
