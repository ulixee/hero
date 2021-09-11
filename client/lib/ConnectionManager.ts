import StateMachine from 'awaited-dom/base/StateMachine';
import { Tab, createTab } from './Tab';
import ConnectionToCore from '../connections/ConnectionToCore';
import CoreSession from './CoreSession';
import ConnectionFactory from '../connections/ConnectionFactory';
import { Hero, IState, IStateOptions } from './Hero';

const { getState } = StateMachine<Hero, IState>();

export default class ConnectionManager {
  readonly #connectionToCore: ConnectionToCore;
  readonly #didCreateConnection: boolean = false;
  readonly #coreSession: Promise<CoreSession | Error>;
  #activeTab: Tab;
  #tabs: Tab[] = [];

  public hasConnected = false;

  public get activeTab(): Tab {
    this.getConnectedCoreSessionOrReject().catch(() => null);
    return this.#activeTab;
  }

  public set activeTab(value: Tab) {
    this.#activeTab = value;
  }

  public get host(): Promise<string> {
    return this.#connectionToCore?.hostOrError.then(x => {
      if (x instanceof Error) throw x;
      return x;
    });
  }

  constructor(private hero: Hero, stateOptions: IStateOptions) {
    const { connectionToCore, ...options } = stateOptions;

    const createConnectionToCoreFn = (hero.constructor as any).createConnectionToCore;
    this.#connectionToCore = ConnectionFactory.createConnection(
      connectionToCore ?? { isPersistent: false },
      createConnectionToCoreFn,
    );

    if (this.#connectionToCore !== connectionToCore) {
      this.#didCreateConnection = true;
    }
    this.sendToActiveTab = this.sendToActiveTab.bind(this);

    this.#coreSession = this.#connectionToCore.createSession(options).catch(err => err);
  }

  public async refreshedTabs(): Promise<Tab[]> {
    const session = await this.getConnectedCoreSessionOrReject();
    const coreTabs = await session.getTabs();
    const tabIds = await Promise.all(this.#tabs.map(x => x.tabId));
    for (const coreTab of coreTabs) {
      const hasTab = tabIds.includes(coreTab.tabId);
      if (!hasTab) {
        const tab = createTab(this.hero, Promise.resolve(coreTab));
        this.#tabs.push(tab);
      }
    }
    return this.#tabs;
  }

  public async close(): Promise<void> {
    if (!this.hasConnected) return;
    const sessionOrError = await this.#coreSession;
    if (sessionOrError instanceof CoreSession) {
      await sessionOrError.close();
    }
    if (this.#didCreateConnection) {
      await this.#connectionToCore.disconnect();
    }
  }

  public closeTab(tab: Tab): void {
    const tabIdx = this.#tabs.indexOf(tab);
    this.#tabs.splice(tabIdx, 1);
    if (this.#tabs.length) {
      this.#activeTab = this.#tabs[0];
    }
  }

  public addTab(tab: Tab): void {
    this.#tabs.push(tab);
  }

  public getConnectedCoreSessionOrReject(): Promise<CoreSession> {
    if (this.hasConnected) {
      return this.#coreSession.then(coreSession => {
        if (coreSession instanceof CoreSession) return coreSession;
        throw coreSession;
      });
    }
    this.hasConnected = true;

    const { clientPlugins } = getState(this.hero);

    const coreSession = this.#coreSession.then(value => {
      if (value instanceof CoreSession) return value;
      throw value;
    });

    const coreTab = coreSession.then(x => x.firstTab).catch(err => err);
    this.#activeTab = createTab(this.hero, coreTab);
    this.#tabs = [this.#activeTab];

    for (const clientPlugin of clientPlugins) {
      if (clientPlugin.onHero) clientPlugin.onHero(this.hero, this.sendToActiveTab.bind(this));
    }

    return coreSession;
  }

  public async sendToActiveTab(toPluginId: string, ...args: any[]): Promise<any> {
    const coreSession = (await this.#coreSession) as CoreSession;
    const coreTab = coreSession.tabsById.get(await this.#activeTab.tabId);
    return coreTab.commandQueue.run('Tab.runPluginCommand', toPluginId, args);
  }
}
