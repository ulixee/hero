import initializeConstantsAndProperties from 'awaited-dom/base/initializeConstantsAndProperties';
import StateMachine from 'awaited-dom/base/StateMachine';
import Browser from './Browser';
import CoreTab from './CoreTab';
import { ICookie } from '../../core-interfaces/ICookie';

const { getState, setState } = StateMachine<Tab, IState>();

export interface IState {
  browser: Browser;
  coreTab: CoreTab;
}

const propertyKeys: (keyof Tab)[] = ['lastCommandId', 'tabId', 'url', 'cookies'];

export default class Tab {
  constructor(browser: Browser, coreTab: CoreTab) {
    initializeConstantsAndProperties(this, [], propertyKeys);
    setState(this, {
      browser,
      coreTab,
    });
  }

  public get tabId(): string {
    return getState(this).coreTab.tabId;
  }

  public get lastCommandId(): number {
    return getState(this).coreTab.commandQueue.lastCommandId;
  }

  public get url(): Promise<string> {
    return getState(this).coreTab.getUrl();
  }

  public get cookies(): Promise<ICookie[]> {
    return getState(this).coreTab.getPageCookies();
  }

  // METHODS

  public async focus() {
    const { browser, coreTab } = getState(this);
    setState(browser, {
      activeTab: this,
    });
    return coreTab.focusTab();
  }

  public async close() {
    const { browser, coreTab } = getState(this);
    const tabs = browser.tabs.filter(x => x !== this);
    if (tabs.length) {
      setState(browser, {
        activeTab: tabs[0],
        tabs,
      });
    }
    return coreTab.closeTab();
  }
}

// CREATE

export function getTabSession(tab: Tab): CoreTab {
  return getState(tab).coreTab;
}

export function createTab(browser: Browser, coreTab: CoreTab): Tab {
  return new Tab(browser, coreTab);
}
