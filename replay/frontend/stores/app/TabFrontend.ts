import { ipcRenderer } from 'electron';
import { action, computed, observable } from 'mobx';
import { TAB_ANIMATION_DURATION, TAB_MAX_WIDTH, TAB_MIN_WIDTH, TABS_PADDING } from './constants';
import { closeWindow } from '../../pages/app/utils/windows';
import { animateTab } from '../../pages/app/utils/tabs';
import ITabLocation from '~shared/interfaces/ITabLocation';
import ITabMeta from '~shared/interfaces/ITabMeta';
import ISaSession from '~shared/interfaces/ISaSession';
import store from '../app';

export default class TabFrontend {
  @observable
  public id: number;

  @observable
  public location: ITabLocation;

  @observable
  public saSession: ISaSession;

  @observable
  public isDragging = false;

  @observable
  public loading = true;

  @observable
  public currentTickValue = 0;

  @observable
  public currentUrl = 'Loading';

  public width = 0;
  public left = 0;

  public isClosing = false;
  public ref: HTMLElement;

  public removeTimeout: any;

  public marginLeft = 0;

  @observable
  public marks: number[] = [];

  @observable
  public markIndicators: { [mark: number]: { isError: boolean } } = {};

  @computed
  public get favicon() {
    if (this.location && this.location === 'NewTab') {
      return '';
    }
    if (this.location) {
      return this.location;
    }
    return '';
  }

  @computed
  public get title() {
    if (this.location && this.location === 'NewTab') {
      return 'New Tab';
    }
    if (this.location) {
      return this.location;
    }
    return this.saSession?.scriptEntrypoint;
  }

  @computed
  public get isSelected() {
    return store.tabs.selectedTabId === this.id;
  }

  @computed
  public get isHovered() {
    return store.tabs.hoveredTabId === this.id;
  }

  @computed
  public get isExpanded() {
    return this.isHovered || this.isSelected || !store.tabs.scrollable;
  }

  @computed
  public get isIconSet() {
    return this.favicon !== '' || this.loading;
  }

  public constructor({ id, location, saSession, active }: ITabMeta) {
    this.id = id;
    this.location = location;
    this.saSession = saSession;

    if (active) {
      requestAnimationFrame(() => {
        this.select();
      });
    }
  }

  public updateSession(session: ISaSession) {
    this.saSession = session;

    const marks = [];
    const markIndicators = {};
    if (this.saSession) {
      for (const tick of this.saSession.ticks) {
        marks.push(tick.playbarOffsetPercent);
        markIndicators[tick.playbarOffsetPercent] = { isError: false };
        const result = this.saSession.commandResults.find(x => x.commandId === tick.commandId);
        if (result?.isError) {
          markIndicators[tick.playbarOffsetPercent].isError = true;
        }
      }
    }
    this.marks = marks;
    this.markIndicators = markIndicators;
  }

  @action
  public async select() {
    if (!this.isClosing) {
      store.tabs.selectedTabId = this.id;
      await ipcRenderer.invoke('tab:select', this.id);
    }
  }

  public getWidth(containerWidth: number = null, tabs: TabFrontend[] = null) {
    if (containerWidth === null) {
      containerWidth = store.tabs.containerWidth;
    }

    if (tabs === null) {
      tabs = store.tabs.list.filter(x => !x.isClosing);
    }

    const realTabsLength = tabs.length + store.tabs.removedTabs;

    const width =
      containerWidth / realTabsLength - TABS_PADDING - store.tabs.leftMargins / realTabsLength;

    if (width > TAB_MAX_WIDTH) {
      return TAB_MAX_WIDTH;
    }
    if (width < TAB_MIN_WIDTH) {
      return TAB_MIN_WIDTH;
    }

    return width;
  }

  public getLeft(calcNewLeft = false) {
    const tabs = store.tabs.list.filter(x => !x.isClosing).slice();

    const index = tabs.indexOf(this);

    let left = 0;

    if (calcNewLeft) store.tabs.calculateTabMargins();

    for (let i = 0; i < index; i += 1) {
      left +=
        (calcNewLeft ? tabs[i].getWidth() : tabs[i].width) + TABS_PADDING + tabs[i].marginLeft;
    }

    return left + this.marginLeft;
  }

  @action
  public setLeft(left: number, animation: boolean) {
    animateTab('translateX', left, this.ref, animation);
    this.left = left;
  }

  @action
  public setWidth(width: number, animation: boolean) {
    animateTab('width', width, this.ref, animation);
    this.width = width;
  }

  @action
  public close() {
    const selected = store.tabs.selectedTabId === this.id;

    ipcRenderer.send('tab:destroy', this.id);

    const notClosingTabs = store.tabs.list.filter(x => !x.isClosing);
    let index = notClosingTabs.indexOf(this);

    if (notClosingTabs.length === 1) {
      closeWindow();
    }

    this.isClosing = true;
    if (notClosingTabs.length - 1 === index) {
      const previousTab = store.tabs.list[index - 1];
      if (previousTab) {
        this.setLeft(previousTab.getLeft(true) + this.getWidth(), true);
      }
      store.tabs.updateTabsBounds(true);
    } else {
      store.tabs.removedTabs += 1;
    }

    this.setWidth(0, true);
    store.tabs.setTabsLefts(true);

    if (selected) {
      index = store.tabs.list.indexOf(this);

      if (
        index + 1 < store.tabs.list.length &&
        !store.tabs.list[index + 1].isClosing &&
        !store.tabs.scrollable
      ) {
        const nextTab = store.tabs.list[index + 1];
        nextTab.select();
      } else if (index - 1 >= 0 && !store.tabs.list[index - 1].isClosing) {
        const prevTab = store.tabs.list[index - 1];
        prevTab.select();
      }
    }

    this.removeTimeout = setTimeout(() => {
      store.tabs.removeTab(this.id);
    }, TAB_ANIMATION_DURATION);
  }

  public async reload(): Promise<any> {
    return await ipcRenderer.invoke('tab:reload', this.id);
  }
}
