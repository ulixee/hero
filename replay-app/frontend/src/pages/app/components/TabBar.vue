<template lang="pug">
.TabBar.Component(:style="cssVars")
  .tabs-wrapper
    .tabs-container(@mouseenter="onMouseEnter" @mouseleave="onTabsMouseLeave" @wheel="onWheel" ref="container")
      Tab(v-for="tab of store.tabs.list" :key="tab.id" :tab="tab")
    AppButton.add-tab(@click="onAddTabClick" :icon="ICON_ADD" :buttonRef="r => (store.addTab.ref = r)")
  .window-controls(v-if="!isMac()")
    button#close-window(@click="onCloseWindow")
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { Observer } from 'mobx-vue';
import os from 'os';
import store from '~frontend/stores/app';
import Tab from '~frontend/pages/app/components/Tab.vue';
import AppButton from '~frontend/pages/app/components/AppButton.vue';
import {
  ADD_TAB_BUTTON_HEIGHT,
  ADD_TAB_BUTTON_WIDTH,
  DEFAULT_TITLEBAR_HEIGHT,
  TOOLBAR_BUTTON_WIDTH,
} from '~shared/constants/design';
import { ICON_ADD } from '@/constants/icons';
import NoCache from '@/lib/NoCache';

let timeout: any;

@Observer
@Component({ components: { Tab, AppButton } })
export default class TabBar extends Vue {
  private readonly store = store;
  private readonly ICON_ADD = ICON_ADD;

  onMouseEnter() {
    clearTimeout(timeout);
  }

  isMac() {
    return os.platform() === 'darwin';
  }

  onTabsMouseLeave() {
    timeout = setTimeout(() => {
      store.tabs.removedTabs = 0;
      store.tabs.updateTabsBounds(true);
    }, 300);
  }

  onAddTabClick() {
    store.tabs.createTab();
  }

  onCloseWindow() {
    this.store.closeWindow();
  }

  onWheel(e: any) {
    if (!store.tabs.containerRef) return;

    const { deltaX, deltaY } = e;
    const { scrollLeft } = store.tabs.containerRef;

    const delta = Math.abs(deltaX) >= Math.abs(deltaY) ? deltaX : -deltaY;
    const target = delta / 2;

    store.tabs.scrollingToEnd = false;
    store.tabs.containerRef.scrollLeft = scrollLeft + target;
  }

  mounted() {
    this.store.tabs.containerRef = this.$refs.container as HTMLElement;
  }

  @NoCache
  private get cssVars() {
    return {
      '--titlebarBackgroundColor': store.theme.titlebarBackgroundColor,
      '--titlebarHeight': `${DEFAULT_TITLEBAR_HEIGHT}px`,
      '--paddingLeft': (this.isMac() && !store.isFullscreen ? 78 : 4) + 'px',
      '--dragRight': (this.isMac() ? 4 : 50) + 'px',
      '--addTabTop': `${store.theme.tabMarginTop + 2}px`,
      '--addTabMinWidth': `${ADD_TAB_BUTTON_WIDTH}px`,
      '--addTabHeight': `${ADD_TAB_BUTTON_HEIGHT}px`,
      '--tabsContainerWidth': `calc(100% - ${TOOLBAR_BUTTON_WIDTH}px)`,
      '--tabCloseIcon': `url('${ICON_CLOSE}')`,
      '--windowButtonsWidth': (this.isMac() ? 4 : 50) + 'px',
      '--windowCloseFilter': store.theme.toolbarLightForeground ? 'invert(100%)' : 'none',
    };
  }
}
</script>

<style lang="scss">
@import '../../../assets/style/common-mixins';
.TabBar {
  position: relative;
  z-index: 100;
  display: flex;
  flex-flow: row;
  color: rgba(0, 0, 0, 0.8);
  width: 100%;

  background-color: var(--titlebarBackgroundColor);
  height: var(--titlebarHeight);
  padding-left: var(--paddingLeft);
  align-items: initial;

  &:before {
    position: absolute;
    z-index: 0;
    top: 4px;
    left: 4px;
    right: var(--dragRight);
    bottom: 0px;
    -webkit-app-region: drag;
    content: '';
  }

  .tabs-wrapper {
    height: 100%;
    width: 100%;
    position: relative;
    overflow: hidden;
    align-items: center;
    margin-right: var(--windowButtonsWidth);
    display: flex;
    margin-left: 4px;

    .add-tab {
      position: absolute;
      left: 0;
      top: var(--addTabTop);
      min-width: var(--addTabMinWidth);
      height: var(--addTabHeight);
    }

    .tabs-container {
      height: 100%;
      width: var(--tabsContainerWidth);
      position: relative;
      overflow: hidden;
      overflow-x: auto;
      white-space: nowrap;

      &::-webkit-scrollbar {
        height: 0px;
        display: none;
        background-color: transparent;
        opacity: 0;
      }
    }
  }
  .window-controls {
    width: var(--windowButtonsWidth);
    height: 100%;
    position: absolute;
    right: 0;
    top: 0;
    z-index: 12;
    -webkit-app-region: no-drag;

    button#close-window {
      height: 100%;
      width: 100%;
      margin: 0;
      border: 0;
      background-image: var(--tabCloseIcon);
      background-color: transparent;
      @include centerIcon(25);
      filter: var(--windowCloseFilter);
      outline: none;

      &:hover {
        background-color: #ff0000dd;
      }
    }
  }
}
</style>
