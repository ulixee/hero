import { IOnClientCommandMeta } from '@ulixee/hero-interfaces/ICorePlugin';
import CorePlugin from '@ulixee/hero-plugin-utils/lib/CorePlugin';
import { IExecuteJsArgs } from './IExecuteJsArgs';

const { name: pluginId } = require('../package.json');

export default class ExecuteJsCorePlugin extends CorePlugin {
  public static override id = pluginId;

  public async onClientCommand(
    { frame, page }: IOnClientCommandMeta,
    args: IExecuteJsArgs,
  ): Promise<any> {
    const { fnName, fnSerialized, isolateFromWebPageEnvironment } = args;
    frame ??= page.mainFrame;
    const result = await frame.evaluate<any>(fnSerialized, isolateFromWebPageEnvironment, {
      includeCommandLineAPI: true,
    });

    if ((result as any)?.error) {
      this.logger.error<any>(fnName, { error: result.error });
      throw new Error((result as any).error as string);
    } else {
      return result as any;
    }
  }
}
