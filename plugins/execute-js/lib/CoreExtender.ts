import { IOnCommandMeta } from '@secret-agent/interfaces/IPluginCoreExtender';
import { IPuppetPage } from '@secret-agent/interfaces/IPuppetPage';
import CoreExtenderBase from '@secret-agent/plugin-utils/lib/CoreExtenderBase';

const { name: pluginId } = require('../package.json');

export default class ExecuteJsCorePlugin extends CoreExtenderBase {
  public static id = pluginId;

  public async onCommand(
    { puppetPage }: IOnCommandMeta,
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
