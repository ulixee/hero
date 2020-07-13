import { observable, action, computed } from 'mobx';
import TabFrontend from './TabFrontend';
import { TAB_ANIMATION_DURATION, TABS_PADDING } from './constants';
import { ipcRenderer } from 'electron';
import { TOOLBAR_HEIGHT } from '~shared/constants/design';
import ICreateTabOptions from '~shared/interfaces/ICreateTabOptions';
import ITabMeta from '~shared/interfaces/ITabMeta';
import { AppStore } from '../app';

export default class TabsStore {
  @observable
  public isDragging = false;

  @observable
  public hoveredTabId: number;

  @observable
  public list: TabFrontend[] = [];

  @observable
  public selectedTabId: number;

  public removedTabs = 0;

  public lastScrollLeft = 0;
  public lastMouseX = 0;
  public mouseStartX = 0;
  public tabStartX = 0;

  public scrollingToEnd = false;
  public scrollable = false;
  public containerRef: HTMLElement;

  public leftMargins = 0;

  private scrollTimeout: any;

  @computed
  public get selectedTab() {
    return this.getTabById(this.selectedTabId);
  }

  @computed
  public get hoveredTab() {
    return this.getTabById(this.hoveredTabId);
  }

  public constructor(private appStore: AppStore) {
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('resize', this.onResize);

    ipcRenderer.on('tabs-resize', () => {
      this.updateTabsBounds(true);
    });

    ipcRenderer.on('insert-tab', (e, tabMeta: ITabMeta, isNext: boolean) => {
      if (isNext) {
        tabMeta.index = this.list.indexOf(this.selectedTab) + 1;
      }
      this.insertTab(tabMeta);
    });

    ipcRenderer.on('select-next-tab', () => {
      const i = this.list.indexOf(this.selectedTab);
      const nextTab = this.list[i + 1];

      if (!nextTab) {
        if (this.list[0]) {
          this.list[0].select();
        }
      } else {
        nextTab.select();
      }
    });

    ipcRenderer.on('select-tab-index', (e, i) => {
      this.list[i]?.select();
    });

    ipcRenderer.on('select-last-tab', () => {
      this.list[this.list.length - 1]?.select();
    });

    ipcRenderer.on('select-previous-tab', () => {
      const i = this.list.indexOf(this.selectedTab);
      const prevTab = this.list[i - 1];

      if (!prevTab) {
        if (this.list[this.list.length - 1]) {
          this.list[this.list.length - 1].select();
        }
      } else {
        prevTab.select();
      }
    });

    ipcRenderer.on('remove-tab', (e, id: number) => {
      this.getTabById(id)?.close();
    });

    ipcRenderer.on('tab:updated', (e, { id, location, saSession, currentTickValue }) => {
      const tab = this.getTabById(id);
      if (!tab) return;
      if (location) {
        tab.location = location;
        tab.updateSession(null);
      } else if (saSession) {
        tab.location = null;
        tab.updateSession(saSession);
      }
      if (currentTickValue !== undefined) {
        tab.currentTickValue = currentTickValue;
      }
    });

    ipcRenderer.on('tab:page-url', (e, { id, url }) => {
      const tab = this.getTabById(id);
      if (!tab) return;
      tab.currentUrl = url;
    });

    ipcRenderer.on('tab:updated-loading', (e, tabId, isLoading) => {
      const tab = this.getTabById(tabId);
      if (tab) {
        tab.loading = isLoading;
      }
    });

    this.createTab();
  }

  @action
  public onResize = (e: Event) => {
    if (e.isTrusted) {
      this.removedTabs = 0;
      this.updateTabsBounds(false);
    }
  };

  public get containerWidth() {
    if (this.containerRef) {
      return this.containerRef.offsetWidth;
    }
    return 0;
  }

  public getTabById(id: number) {
    return this.list.find(x => x.id === id);
  }

  public scrollToEnd = (milliseconds: number) => {
    if (!this.scrollable) return;

    const frame = () => {
      if (!this.scrollingToEnd || !this.containerRef) return;
      this.containerRef.scrollLeft = this.containerRef.scrollWidth;
      requestAnimationFrame(frame);
    };

    if (!this.scrollingToEnd) {
      this.scrollingToEnd = true;
      frame();
    }

    clearTimeout(this.scrollTimeout);

    this.scrollTimeout = setTimeout(() => {
      this.scrollingToEnd = false;
    }, milliseconds);
  };

  @action public async createTab(options?: ICreateTabOptions) {
    const tabMeta: ITabMeta = await ipcRenderer.invoke('tab:create', options, false);
    return this.insertTab(tabMeta);
  }

  public removeTab(id: number) {
    (this.list as any).remove(this.getTabById(id));
  }

  @action public updateTabsBounds(animation: boolean) {
    this.calculateTabMargins();
    this.setTabsWidths(animation);
    this.setTabsLefts(animation);
  }

  @action public calculateTabMargins() {
    const tabs = this.list.filter(x => !x.isClosing);

    this.leftMargins = 0;

    for (const tab of tabs) {
      tab.marginLeft = 6; // might should be 0
      this.leftMargins += tab.marginLeft;
    }
  }

  @action public setTabsWidths(animation: boolean) {
    const tabs = this.list.filter(x => !x.isClosing);

    const containerWidth = this.containerWidth;

    for (const tab of tabs) {
      const width = tab.getWidth(containerWidth, tabs);
      tab.setWidth(width, animation);
      this.scrollable = width === 72;
    }
  }

  @action public setTabsLefts(animation: boolean) {
    const tabs = this.list.filter(x => !x.isClosing);
    const { containerWidth } = this.appStore.tabs;

    let left = 0;

    for (const tab of tabs) {
      left += tab.marginLeft;

      if (!tab.isDragging) {
        tab.setLeft(left, animation);
      }

      left += tab.width + TABS_PADDING;
    }

    this.appStore.addTab.setLeft(Math.min(left, containerWidth + TABS_PADDING), animation);
  }

  @action
  public replaceTab(firstTab: TabFrontend, secondTab: TabFrontend) {
    const index = this.list.indexOf(secondTab);

    this.list[this.list.indexOf(firstTab)] = secondTab;
    this.list[index] = firstTab;

    this.updateTabsBounds(true);
  }

  public getTabsToReplace(callingTab: TabFrontend, direction: string) {
    const tabs = this.list;
    const index = tabs.indexOf(callingTab);

    if (direction === 'left') {
      for (let i = index - 1; i >= 0; i -= 1) {
        const tab = tabs[i];

        if (callingTab.left <= tab.width / 2 + tab.left) {
          this.replaceTab(tabs[i + 1], tab);
        } else {
          break;
        }
      }
    } else if (direction === 'right') {
      for (let i = index + 1; i < tabs.length; i += 1) {
        const tab = tabs[i];

        if (callingTab.left + callingTab.width >= tab.width / 2 + tab.left) {
          this.replaceTab(tabs[i - 1], tab);
        } else {
          break;
        }
      }
    }
  }

  @action
  public onMouseUp = () => {
    const selectedTab = this.selectedTab;

    this.isDragging = false;

    if (selectedTab) {
      selectedTab.isDragging = false;
    }

    this.updateTabsBounds(true);
  };

  @action
  public onMouseMove = (e: any) => {
    if (this.isDragging) {
      const container = this.containerRef;
      const { tabStartX, mouseStartX, lastMouseX, lastScrollLeft } = this.appStore.tabs;

      const boundingRect = container.getBoundingClientRect();

      if (Math.abs(e.pageX - mouseStartX) < 5) {
        return;
      }

      this.selectedTab.isDragging = true;

      const newLeft = tabStartX + e.pageX - mouseStartX - (lastScrollLeft - container.scrollLeft);

      let left = Math.max(0, newLeft);

      if (
        newLeft + this.selectedTab.width >
        container.scrollLeft + container.offsetWidth - TABS_PADDING + 20
      ) {
        left =
          container.scrollLeft + container.offsetWidth - this.selectedTab.width - TABS_PADDING + 20;
      }

      this.selectedTab.setLeft(left, false);
      this.getTabsToReplace(this.selectedTab, lastMouseX - e.pageX >= 1 ? 'left' : 'right');

      this.lastMouseX = e.pageX;
    }
  };

  @action private insertTab(tabMeta: ITabMeta) {
    this.removedTabs = 0;
    const tabFrontend = new TabFrontend(tabMeta);

    this.list.push(tabFrontend);

    requestAnimationFrame(() => {
      tabFrontend.setLeft(tabFrontend.getLeft(), false);
      this.updateTabsBounds(true);
      this.scrollToEnd(TAB_ANIMATION_DURATION);
    });
    return tabFrontend;
  }
}
