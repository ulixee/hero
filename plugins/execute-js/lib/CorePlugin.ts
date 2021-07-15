import { IOnClientCommandMeta } from '@ulixee/hero-interfaces/ICorePlugin';
import { IPuppetPage } from '@ulixee/hero-interfaces/IPuppetPage';
import CorePlugin from '@ulixee/hero-plugin-utils/lib/CorePlugin';

const { name: pluginId } = require('../package.json');

export default class ExecuteJsCorePlugin extends CorePlugin {
  public static id = pluginId;

  public async onClientCommand(
    { puppetPage }: IOnClientCommandMeta,
    fnName: string,
    serializedFn: string,
  ): Promise<any> {
    const response = await this.runFn(puppetPage, fnName, serializedFn);
    return response;
  }

  private async runFn(puppetPage: IPuppetPage, fnName: string, serializedFn: string) {
    const result = await puppetPage.evaluate<any>(serializedFn);

    if ((result as any)?.error) {
      this.logger.error<any>(fnName, { result });
      throw new Error((result as any).error as string);
    } else {
      return result as any;
    }
  }
}
