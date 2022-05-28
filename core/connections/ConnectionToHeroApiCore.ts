import { ConnectionToCore } from '@ulixee/net';
import { IHeroCoreApiHandlers } from '../apis';

export default class ConnectionToHeroApiCore extends ConnectionToCore<IHeroCoreApiHandlers, {}> {}
