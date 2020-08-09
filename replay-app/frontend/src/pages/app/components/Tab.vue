<template lang="pug">
.Tab.Component(
  @mousedown="onMouseDown"
  @mouseup="onMouseUp"
  @mouseenter="onMouseEnter"
  @contextmenu="onContextMenu"
  @click="onClick"
  @mouseleave="onMouseLeave"
  :style="cssVars"
)
  .tab-container
    .tab-content
      Preloader(v-if="tab.loading" :color="store.theme.accentColor" :thickness="6" :size="16" indeterminate style="minWidth: 16px")
      .tab-icon(v-if="!tab.loading && tab.favicon")
      .tab-title(:class="{ script: tab.isScriptLocation }") {{tab.title}}
      .tab-close(@mousedown="onCloseMouseDown" @click="removeTab")
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { Observer } from 'mobx-vue';
import { remote } from 'electron';
import Preloader from '~frontend/components/Preloader.vue';
import TabFrontend from '~frontend/stores/app/TabFrontend';
import store from '~frontend/stores/app';
import { TAB_MAX_WIDTH } from '~frontend/stores/app/constants';

import {
  transparency,
  ICON_CLOSE,
  ICON_HOME,
  ICON_SETTINGS,
  ICON_HISTORY,
} from '~frontend/constants';
import NoCache from '~frontend/lib/NoCache';

const ICONS = {
  Home: ICON_HOME,
  Settings: ICON_SETTINGS,
  History: ICON_HISTORY,
};

const TabProps = Vue.extend({ props: { tab: TabFrontend } });

@Observer
@Component({ components: { Preloader } })
export default class Tab extends TabProps {
  private readonly store = store;

  removeTab(e: any) {
    e.stopPropagation();
    this.tab.close();
  }

  onCloseMouseDown(e: any) {
    e.stopPropagation();
  }

  onMouseDown(e: any) {
    const { pageX, button } = e;

    if (button === 0) {
      if (!this.tab.isSelected) {
        this.tab.select();
      }

      store.tabs.lastMouseX = 0;
      store.tabs.isDragging = true;
      store.tabs.mouseStartX = pageX;
      store.tabs.tabStartX = this.tab.left;
      store.tabs.lastScrollLeft = store.tabs.containerRef.scrollLeft;
    }
  }

  onMouseEnter(e: any) {
    if (!store.tabs.isDragging) {
      store.tabs.hoveredTabId = this.tab.id;
    }
  }

  onMouseLeave() {
    store.tabs.hoveredTabId = -1;
  }

  onClick(e: any) {
    if (e.button === 4) {
      this.tab.close();
      return;
    }
  }

  onMouseUp(e: any) {
    if (e.button === 1) {
      this.tab.close();
    }
  }

  onContextMenu() {
    const menu = remote.Menu.buildFromTemplate([
      {
        label: 'New tab to the right',
        click: () => {
          store.tabs.createTab({ index: store.tabs.list.indexOf(store.tabs.selectedTab) + 1 });
        },
      },
      {
        type: 'separator',
      },
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: () => {
          this.tab.reload();
        },
      },
      {
        label: 'Duplicate',
        click: () => {
          store.tabs.createTab({ active: true, location: this.tab.location });
        },
      },
      {
        type: 'separator',
      },
      {
        label: 'Close tab',
        accelerator: 'CmdOrCtrl+W',
        click: () => {
          this.tab.close();
        },
      },
      {
        label: 'Close other tabs',
        click: () => {
          for (const tab of store.tabs.list) {
            if (tab !== this.tab) {
              tab.close();
            }
          }
        },
      },
      {
        label: 'Close tabs to the left',
        click: () => {
          for (let i = store.tabs.list.indexOf(this.tab) - 1; i >= 0; i -= 1) {
            store.tabs.list[i].close();
          }
        },
      },
      {
        label: 'Close tabs to the right',
        click: () => {
          const list = store.tabs.list;
          for (let i = list.length - 1; i > list.indexOf(this.tab); i -= 1) {
            list[i].close();
          }
        },
      },
    ]);

    menu.popup();
  }

  @NoCache
  public get cssVars() {
    let containerBackgroundColor = this.store.theme.toolbarBackgroundColor;
    if (!this.tab.isSelected) {
      const lightForeground = store.theme.toolbarLightForeground;
      const defaultColor = lightForeground
        ? 'rgba(255, 255, 255, 0.04)'
        : 'rgba(255, 255, 255, 0.3)';
      const defaultHoverColor = lightForeground
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(255, 255, 255, 0.5)';
      containerBackgroundColor = this.tab.isHovered ? defaultHoverColor : defaultColor;
    }

    const faviconImage = ICONS[this.tab.favicon] || this.tab.favicon;

    return {
      '--tabZIndex': this.tab.isSelected ? 2 : 1,
      '--containerBackgroundColor': containerBackgroundColor,
      '--containerBoxShadow': this.tab.isSelected ? '0px 0px 6px 0px rgba(0,0,0,0.12)' : 'none',
      '--tabMarginTop': `${store.theme.tabMarginTop}px`,
      '--tabHeight': `${store.theme.tabHeight}px`,
      '--tabDefaultWidth': `${TAB_MAX_WIDTH}px`,
      '--tabIconMinWidth': this.tab.favicon ? '16px' : 0,
      '--tabIconOpacity': this.tab.favicon ? 1 : 0,
      '--tabIconBackgroundImage': `url('${faviconImage}')`,
      '--tabTitleMarginLeft': `${!this.tab.isIconSet ? 0 : 6}px`,
      '--tabTitleColor': this.tab.isSelected
        ? store.theme.tabSelectedTextColor
        : store.theme.tabTextColor,
      '--tabCloseIcon': `url('${ICON_CLOSE}')`,
      '--tabCloseOpacity': this.tab.isExpanded ? transparency.icons.inactive : 0,
      '--tabCloseDisplay': this.tab.isExpanded ? 'block' : 'none',
      '--tabCloseFilter': store.theme.toolbarLightForeground ? 'invert(100%)' : 'none',
    };
  }

  mounted() {
    this.tab.ref = this.$el as HTMLElement;
  }
}
</script>

<style lang="scss">
@import '../../../assets/style/common-mixins';

.Tab {
  position: absolute;
  height: 100%;
  width: var(--tabDefaultWidth);
  left: 0;
  will-change: width, transform;
  -webkit-app-region: no-drag;
  display: flex;
  backface-visibility: hidden;
  z-index: var(--tabZIndex);

  .tab-container {
    position: relative;
    width: 100%;
    align-items: center;
    overflow: hidden;
    display: flex;
    backface-visibility: hidden;
    transition: 0.1s background-color;
    border-bottom: transparent !important;
    border: 2px solid;
    border-color: transparent;
    background-color: var(--containerBackgroundColor);
    max-width: 100%;
    border-radius: 4px 4px 0 0;
    box-shadow: var(--containerBoxShadow);
    margin-top: var(--tabMarginTop);
    height: var(--tabHeight);
  }

  .tab-content {
    overflow: hidden;
    z-index: 2;
    align-items: center;
    display: flex;
    margin-left: 10px;
    flex: 1;
  }

  .tab-icon {
    height: var(--tabHeight);
    transition: 0.2s opacity, 0.2s min-width;
    @include centerIcon();
    min-width: var(--tabIconMinWidth);
    opacity: var(--tabIconOpacity);
    background-image: var(--tabIconBackgroundImage);
  }

  .tab-title {
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: 0.2s margin-left;
    min-width: 0;
    flex: 1;
    margin-left: var(--tabTitleMarginLeft);
    color: var(--tabTitleColor);
    &.script {
      direction: rtl;
    }
    .location {
      text-transform: capitalize;
    }
  }

  .tab-close {
    height: 20px;
    width: 20px;
    margin-left: 2px;
    margin-right: 6px;
    border-radius: 2px;
    background-image: var(--tabCloseIcon);
    transition: 0.1s background-color;
    z-index: 10;
    @include centerIcon(16);
    opacity: var(--tabCloseOpacity);
    display: var(--tabCloseDisplay);
    filter: var(--tabCloseFilter);

    &:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }
  }
}
</style>
