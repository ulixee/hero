import { IOnClientCommandMeta } from '@ulixee/hero-interfaces/ICorePlugin';
import CorePlugin from '@ulixee/hero-plugin-utils/lib/CorePlugin';
import { IExecuteJsArgs } from './IExecuteJsArgs';
export default class ExecuteJsCorePlugin extends CorePlugin {
    static id: any;
    onClientCommand({ frame, page }: IOnClientCommandMeta, args: IExecuteJsArgs): Promise<any>;
}
