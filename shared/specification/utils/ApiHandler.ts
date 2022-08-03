import { IZodApiTypes } from './IZodApi';
import ValidationError from './ValidationError';

export default class ApiHandler<
  APIs extends IApiDefinition,
  Command extends keyof IApiDefinition & string,
  IHandlerOptions = any,
> {
  public apiHandler: (
    args: IApiDefinition[Command]['args'],
    options?: IHandlerOptions,
  ) => Promise<IApiDefinition[Command]['result']>;

  protected validationSchema: IZodApiTypes | undefined;

  constructor(
    public readonly command: Command,
    args: {
      validationSchema?: IZodApiTypes;
      handler: (
        this: ApiHandler<APIs, Command, IHandlerOptions>,
        args: IApiDefinition[Command]['args'],
        options?: IHandlerOptions,
      ) => Promise<IApiDefinition[Command]['result']>;
    },
  ) {
    this.apiHandler = args.handler.bind(this);
    this.validationSchema = args.validationSchema;
  }

  public async handler(
    rawArgs: unknown,
    options?: IHandlerOptions,
  ): Promise<IApiDefinition[Command]['result']> {
    const args = this.validatePayload(rawArgs);
    return await this.apiHandler(args, options);
  }

  public validatePayload(data: unknown): IApiDefinition[Command]['args'] {
    if (!this.validationSchema) return;
    // NOTE: mutates `errors`
    const result = this.validationSchema.args.safeParse(data);
    if (result.success) return result.data;

    const errorList = result.error.issues.map(x => `"${x.path.join('.')}": ${x.message}`);

    throw new ValidationError(this.command, errorList);
  }
}

export type IApiDefinition = {
  [command: string]: IApi<any, any>;
};

export type IApi<ArgType extends object, ReturnType extends object> = {
  args: ArgType;
  result: ReturnType;
};
