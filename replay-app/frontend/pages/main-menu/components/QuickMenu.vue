<template lang="pug">
.QuickMenu.Component(:style="cssVars")
  .content
    .menu-items
      .menu-item(@click="onAlwaysClick")
        .icon(:style="`background-image: url(${ICON_TOPMOST})`")
        .menu-item-title Always on Top
        .right-control
          //Switch(:value="store.alwaysOnTop")
      .line
      .menu-item(@click="createNewTab('Home')")
        .icon(:style="`background-image: url(${ICON_TAB})`")
        .menu-item-title New Tab
        .shortcut Ctrl+T
      .menu-item(@click="onNewWindowClick")
        .icon(:style="`background-image: url(${ICON_WINDOW})`")
        .menu-item-title New Window
        .shortcut Ctrl+N
      .line
      .menu-item(@click="createNewTab('History')")
        .icon(:style="`background-image: url(${ICON_HISTORY})`")
        .menu-item-title History
      .line
      .menu-item(@click="createNewTab('Settings')")
        .icon(:style="`background-image: url(${ICON_SETTINGS})`")
        .menu-item-title Settings
      //.line
      //.menu-item(@click="onFindInPageClick")
        .icon(:style="`background-image: url(${ICON_FIND})`")
        .menu-item-title Find in page
        .shortcut Ctrl+F
      //.menu-item(@click="onPrintClick")
        .icon(:style="`background-image: url(${ICON_PRINT})`")
        .menu-item-title Print
        .shortcut Ctrl+P
</template>
<script lang="ts">
import Vue from 'vue';
import Component from 'nuxt-class-component';
import store from '~frontend/stores/main-menu';
import { ipcRenderer, remote } from 'electron';

import {
  ICON_FIRE,
  ICON_TOPMOST,
  ICON_TAB,
  ICON_WINDOW,
  ICON_HISTORY,
  ICON_SETTINGS,
  ICON_FIND,
  ICON_PRINT,
  ICON_ARROW_RIGHT,
} from '~frontend/constants/icons';
import NoCache from '~frontend/lib/NoCache';
import ITabLocation from "~shared/interfaces/ITabLocation";

@Component({ components: {} })
export default class QuickMenu extends Vue {
  private ICON_FIRE = ICON_FIRE;
  private ICON_TOPMOST = ICON_TOPMOST;
  private ICON_TAB = ICON_TAB;
  private ICON_WINDOW = ICON_WINDOW;
  private ICON_HISTORY = ICON_HISTORY;
  private ICON_SETTINGS = ICON_SETTINGS;
  private ICON_FIND = ICON_FIND;
  private ICON_PRINT = ICON_PRINT;

  private onFindClick() {
    // TODO(sentialx): get selected tab
    // ipcRenderer.send(
    //   'overlay:toggle'
    //   'find',
    //   store.tabs.selectedTab.id,
    //   store.tabs.selectedTab.findInfo,
    // );
  }

  private onPrintClick() {
    ipcRenderer.send('tab:print', null);
    store.hide();
  }

  private onFindInPageClick() {
    ipcRenderer.send('find-in-page');
    store.hide();
  }

  private onAlwaysClick() {
    store.alwaysOnTop = !store.alwaysOnTop;
    remote.getCurrentWindow().setAlwaysOnTop(store.alwaysOnTop);
  }

  private onNewWindowClick() {
    ipcRenderer.send('window:create');
  }

  private createNewTab(location: ITabLocation) {
    ipcRenderer.send('tab:create', { location, active: true }, true);
    store.hide();
  }

  private onUpdateClick() {
    ipcRenderer.send('install-update');
  }

  @NoCache
  private get cssVars() {
    const dialogLightForeground = store.theme.dialogLightForeground;
    return {
      '--lineBackgroundColor': store.theme.dialogSeparatorColor,
      '--menuItemBackgroundColor': store.theme.dialogBackgroundColor,
      '--menuItemColor': store.theme.dialogTextColor,
      '--iconFilter': dialogLightForeground ? 'invert(100%)' : 'none',
      '--menuItemArrowBackgroundImage': `url(${ICON_ARROW_RIGHT})`,
      '--menuItemArrowFilter': dialogLightForeground ? 'invert(100%)' : 'none',
      '--menuItemHoverBackgroundColor': dialogLightForeground
        ? 'rgba(255, 255, 255, 0.06)'
        : 'rgba(0, 0, 0, 0.03)',
    };
  }
}
</script>

<style lang="scss">
@import '../../../assets/style/common-mixins';

.QuickMenu {
  display: flex;
  flexflow: column;

  .content {
    display: flex;
    flex-flow: column;
    position: relative;
    width: 100%;
  }

  .line {
    height: 1px;
    width: 100%;
    margin-top: 4px;
    margin-bottom: 4px;
    background-color: var(--lineBackgroundColor);
  }

  .menu-item {
    height: 36px;
    align-items: center;
    display: flex;
    position: relative;
    padding: 0 12px;
    font-size: 12px;

    &:hover {
      background-color: var(--menuItemHoverBackgroundColor);
    }

    &[arrow]:after {
      content: '';
      position: absolute;
      right: 4px;
      width: 24px;
      height: 100%;
      opacity: 0.54;
      @include centerIcon(20);
      background-image: var(--menuItemArrowBackgroundImage);
      filter: var(--menuItemArrowFilter);
    }
  }

  .menu-items {
    flex: 1;
    overflow: hidden;
    padding-top: 4px;
    padding-bottom: 4px;
    background-color: var(--menuItemBackgroundColor);
    color: var(--menuItemColor);
  }

  .menu-item-title {
    flex: 1;
  }

  .right-control {
    margin-right: 18px;
  }

  .shortcut {
    margin-right: 18px;
    opacity: 0.54;
  }

  .icon {
    margin-right: 12px;
    width: 20px;
    height: 20px;
    @include centerIcon();
    opacity: 0.8;
    filter: var(--iconFilter);
  }
}
</style>
