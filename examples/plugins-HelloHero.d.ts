import { ClientPlugin } from '@ulixee/hero-plugin-utils';
export default class ClientHelloPlugin extends ClientPlugin {
    static readonly id = "client-hello-plugin";
    onHero(hero: any, sendToCore: any): Promise<void>;
}
