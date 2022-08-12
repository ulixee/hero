import { IZodApiSpec, IZodHandlers, IZodSchemaToApiTypes } from './IZodApi';
import ApiHandler from './ApiHandler';

export default class ApiRouter<
  ApiSpec extends IZodApiSpec,
  IHandlers extends IZodHandlers<ApiSpec>,
> {
  public handlers: IHandlers = {} as any;

  constructor(
    readonly schema: ApiSpec,
    handlers: ApiHandler<ApiSpec, keyof ApiSpec & string, IZodSchemaToApiTypes<ApiSpec>>[]
  ) {
    this.register(...handlers)
  }

  register(
    ...handlers: ApiHandler<ApiSpec, keyof ApiSpec & string, IZodSchemaToApiTypes<ApiSpec>>[]
  ): ApiRouter<ApiSpec, IHandlers> {
    for (const apiHandler of handlers) {
      this.handlers[apiHandler.command] = apiHandler.handler.bind(apiHandler) as any;
    }
    return this;
  }

  registerHandler<Command extends keyof ApiSpec & string>(
    command: Command,
    handler: IHandlers[Command],
  ): ApiRouter<ApiSpec, IHandlers> {
    const apiHandler = new ApiHandler(command as any, this.schema, {
      handler,
    });
    this.handlers[command] = apiHandler.handler.bind(apiHandler) as any;
    return this;
  }
}
