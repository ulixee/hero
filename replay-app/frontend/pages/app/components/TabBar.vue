<template lang="pug">
.TabBar.Component(:style="cssVars")
  .tabs-wrapper
    .tabs-container(@mouseenter="onMouseEnter" @mouseleave="onTabsMouseLeave" @wheel="onWheel" ref="container")
      Tab(v-for="tab of store.tabs.list" :key="tab.id" :tab="tab")
    AppButton.add-tab(@click="onAddTabClick" :icon="ICON_ADD" :buttonRef="r => (store.addTab.ref = r)")
  //.windows-controls(v-if="platform !== 'darwin'") look at react-windows-controls
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'nuxt-class-component';
import { Observer } from 'mobx-vue';
import { platform } from 'os';
import store from '~frontend/stores/app';
import Tab from '~frontend/pages/app/components/Tab.vue';
import AppButton from '~frontend/pages/app/components/AppButton.vue';
import {
  ADD_TAB_BUTTON_HEIGHT,
  ADD_TAB_BUTTON_WIDTH,
  DEFAULT_TITLEBAR_HEIGHT,
  TOOLBAR_BUTTON_WIDTH,
} from '~shared/constants/design';
import { ICON_ADD } from '~frontend/constants/icons';
import NoCache from '~frontend/lib/NoCache';

let timeout: any;

@Observer
@Component({ components: { Tab, AppButton } })
export default class TabBar extends Vue {
  private readonly store = store;
  private readonly ICON_ADD = ICON_ADD;

  onMouseEnter() {
    clearTimeout(timeout);
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
      '--paddingLeft': (platform() === 'darwin' && !store.isFullscreen ? 78 : 4) + 'px',
      '--addTabTop': `${store.theme.tabMarginTop + 2}px`,
      '--addTabMinWidth': `${ADD_TAB_BUTTON_WIDTH}px`,
      '--addTabHeight': `${ADD_TAB_BUTTON_HEIGHT}px`,
      '--tabsContainerWidth': `calc(100% - ${TOOLBAR_BUTTON_WIDTH}px)`,
    };
  }
}
</script>

<style lang="scss">
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
    right: 4px;
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
    margin-right: 32px;
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
}
</style>
