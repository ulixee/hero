import { z } from 'zod';
import { IZodApiSpec } from './IZodApi';
import ApiHandler, { IApiDefinition } from './ApiHandler';

export default class ApiRouter<ApiSpec extends IZodApiSpec> {
  public handlers: {
    [Command in keyof ApiSpec]: (args: z.infer<ApiSpec[Command]['args']>) => Promise<z.infer<ApiSpec[Command]['result']>>;
  } = {} as any;

  constructor(readonly schema: ApiSpec) {}

  register<Command extends keyof IApiDefinition & string>(
    command: Command,
    handler: (args: IApiDefinition[Command]['args']) => Promise<IApiDefinition[Command]['result']>,
  ): ApiRouter<ApiSpec> {
    const apiHandler = new ApiHandler(command, { handler });
    this.handlers[command] = apiHandler.handler.bind(handler);
    return this;
  }
}
