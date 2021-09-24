import { IOnClientCommandMeta } from '@ulixee/hero-interfaces/ICorePlugin';
import CorePlugin from '@ulixee/hero-plugin-utils/lib/CorePlugin';
import { IPuppetFrame } from '@ulixee/hero-interfaces/IPuppetFrame';

const { name: pluginId } = require('../package.json');

export default class ExecuteJsCorePlugin extends CorePlugin {
  public static id = pluginId;

  public async onClientCommand(
    { puppetFrame, puppetPage }: IOnClientCommandMeta,
    fnName: string,
    serializedFn: string,
  ): Promise<any> {
    const response = await this.runFn(puppetFrame ?? puppetPage.mainFrame, fnName, serializedFn);
    return response;
  }

  private async runFn(puppetFrame: IPuppetFrame, fnName: string, serializedFn: string) {
    const result = await puppetFrame.evaluate<any>(serializedFn, false);

    if ((result as any)?.error) {
      this.logger.error<any>(fnName, { result });
      throw new Error((result as any).error as string);
    } else {
      return result as any;
    }
  }
}
