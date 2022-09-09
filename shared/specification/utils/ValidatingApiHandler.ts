import { IZodApiSpec, IZodApiTypes, IZodSchemaToApiTypes } from './IZodApi';
import ValidationError from './ValidationError';

export default class ValidatingApiHandler<
  APIs extends IZodApiSpec,
  Command extends keyof APIs & string,
  APISpec extends IZodSchemaToApiTypes<APIs>,
  IHandlerOptions = any,
> {
  protected apiHandler: (
    this: ValidatingApiHandler<APIs, Command, APISpec, IHandlerOptions>,
    args: APISpec[Command]['args'],
    options?: IHandlerOptions,
  ) => Promise<APISpec[Command]['result']>;

  protected validationSchema: IZodApiTypes | undefined;

  constructor(
    public readonly command: Command,
    protected apiSchema: APIs,
    args: {
      handler: ValidatingApiHandler<APIs, Command, APISpec, IHandlerOptions>['apiHandler'];
    },
  ) {
    this.apiHandler = args.handler.bind(this);
    this.validationSchema = apiSchema[command];
  }

  public async handler(
    rawArgs: unknown,
    options?: IHandlerOptions,
  ): Promise<APISpec[Command]['result']> {
    const args = this.validatePayload(rawArgs);
    return await this.apiHandler(args, options);
  }

  public validatePayload(data: unknown): APISpec[Command]['args'] {
    if (!this.validationSchema) return data;
    // NOTE: mutates `errors`
    const result = this.validationSchema.args.safeParse(data);
    if (result.success) return result.data;


    throw ValidationError.fromZodValidation(
      `The parameters for this command (${this.command}) are invalid.`,
      result.error,
    );
  }
}
