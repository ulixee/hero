<template lang="pug">
.AddressBar.Component(:style="cssVars")
  .left-buttons
    //Icon(:src="ICON_REFRESH" :size=16 iconStyle="transform: 'scale(-1,1)'")
    //Icon(:src="ICON_HOME" :size=16 :disabled="isHome" iconStyle="transform: 'scale(-1,1)'" @click="gotoLocation('home')") :disabled="isHome"
  .location(ref="location")
    template(v-if="store.saSession")
      .script-section.section(@mousedown="showLocationOverlay($event, 'locations-menu')")
        Icon(:src="ICON_SCRIPT" :size=16 iconStyle="transform: 'scale(-1,1)'")
        .text {{store.saSession.scriptEntrypoint}}
      .session-section.section(@mousedown="showLocationOverlay($event, 'script-instances-menu')")
        Icon(:src="ICON_CLOCK" :size=16 iconStyle="transform: 'scale(-1,1)'")
        .text {{store.saSession.scriptStartDate}}
      .window-section.section(@mousedown="showLocationOverlay($event, 'sessions-menu')")
        Icon(:src="ICON_NUMBER" :size=16 iconStyle="transform: 'scale(-1,1)'")
        .text {{1}} of {{store.saSession.relatedScriptInstances.length}}
      .page-section.section(@mousedown="showLocationOverlay($event, 'session-pages-menu')")
        Icon.lock(:src="ICON_LOCK" :size=16 iconStyle="transform: 'scale(-1,1)'")
        .text {{store.pageUrl}}
    template(v-else-if="store.location")
      .name-section.section(@mousedown="showLocationOverlay($event, 'locations-menu')")
        .brand SecretAgent
        .text {{store.location}}
  .right-buttons
    AppButton(
      @mousedown="showMainMenuOverlay"
      :buttonRef="r => (menuRef = r)"
      :toggled="store.overlayVisibility['main']"
      :badge="store.updateAvailable"
      :badgeRight=10
      :badgeTop=6
      :icon="ICON_MORE"
      :size=18
    )
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { Observer } from 'mobx-vue';
import { ipcRenderer } from 'electron';
import AppButton from './AppButton.vue';
import Icon from '~frontend/components/Icon.vue';
import { TOOLBAR_HEIGHT } from '~shared/constants/design';
import {
  ICON_MORE,
  ICON_REFRESH,
  ICON_SCRIPT,
  ICON_CLOCK,
  ICON_NUMBER,
  ICON_LOCK,
  ICON_HOME,
} from '~frontend/constants/icons';
import store from '~frontend/stores/app';
import NoCache from '~frontend/lib/NoCache';
import ITabLocation, { InternalLocations } from '~shared/interfaces/ITabLocation';
import { toJS } from 'mobx';

@Observer
@Component({ components: { AppButton, Icon } })
export default class AddressBar extends Vue {
  public $refs: any;
  private menuRef: HTMLElement;
  private readonly store = store;

  private readonly ICON_HOME = ICON_HOME;
  private readonly ICON_MORE = ICON_MORE;
  private readonly ICON_REFRESH = ICON_REFRESH;
  private readonly ICON_SCRIPT = ICON_SCRIPT;
  private readonly ICON_CLOCK = ICON_CLOCK;
  private readonly ICON_NUMBER = ICON_NUMBER;
  private readonly ICON_LOCK = ICON_LOCK;

  @NoCache
  private get isHome() {
    return store.location === InternalLocations.Home;
  }

  @NoCache
  private get cssVars() {
    return {
      '--addressBarBackgroundColor': store.theme.addressBarBackgroundColor,
      '--addressBarTextColor': store.theme.addressBarTextColor,
      '--toolbarLightForeground':
        store.theme.toolbarLightForeground || '1px solid rgba(0, 0, 0, 0.12)',
      '--toolbarHeight': `${TOOLBAR_HEIGHT}px`,
      '--toolbarBackgroundColor': store.theme.toolbarBackgroundColor,
      '--toolbarBorderBottomColor': store.theme.toolbarBottomLineBackgroundColor,
    };
  }

  private showLocationOverlay(e: any, name) {
    const overlayRect = e.target.getBoundingClientRect().toJSON();
    const parentRect = this.$refs.location.getBoundingClientRect();
    const parentWidth = this.$refs.location.getBoundingClientRect().width;
    const fromLeft = overlayRect.left - parentRect.left;
    if (name === 'locations-menu') {
      overlayRect.width = parentWidth;
      overlayRect.x -= fromLeft;
    } else {
      overlayRect.width = parentWidth - fromLeft;
    }
    ipcRenderer.send('overlay:toggle', name, overlayRect);
  }

  private gotoLocation(location: ITabLocation) {
    ipcRenderer.send(`navigate-to-location`, location, true);
  }

  private showMainMenuOverlay() {
    const rect = this.menuRef.getBoundingClientRect().toJSON();
    ipcRenderer.send('overlay:toggle', 'main-menu', rect);
  }
}
</script>

<style lang="scss">
.AddressBar {
  position: relative;
  z-index: 100;
  display: flex;
  align-items: center;
  flex-flow: row;
  color: rgba(0, 0, 0, 0.8);
  width: 100%;
  height: var(--toolbarHeight);
  background-color: var(--toolbarBackgroundColor);
  border-bottom: 1px solid var(toolbarBorderBottomColor);

  .left-buttons {
    display: flex;
    align-items: center;
    margin-left: 4px;
  }

  .right-buttons {
    display: flex;
    align-items: center;
    margin-right: 4px;
  }

  .location {
    flex: 1;
    margin: 3px 10px;
    display: flex;
    align-items: center;
    position: relative;
    font-size: 15px;
    overflow: hidden;
    color: var(--addressBarTextColor);
    overflow: hidden;
    height: 30px;
    border-radius: 15px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    background-color: var(--addressBarBackgroundColor);
    box-shadow: 0px 0px 1px 0px rgba(0, 0, 0, 0.1);

    .section {
        cursor: pointer;
      flex: 1;
      position: relative;
      height: 100%;
      box-sizing: border-box;
      padding-top: 6px;
      padding-right: 5px;
      margin-top: 0;
      font-size: 13px;
      white-space: nowrap;
      min-width: 100px;
      overflow: hidden;
      border-left: 1px solid rgba(0, 0, 0, 0.1);
      padding-left: 10px;
      .text {
        cursor: pointer;
        pointer-events: none;
        display: inline-block;
        padding-left: 5px;
        line-height: 16px;
        vertical-align: top;
      }
      .Icon {
        pointer-events: none;
        margin-top: 1px;
      }
      &:first-child {
        border-left: none;
      }
      &:hover {
        background: rgba(0, 0, 0, 0.05);
      }
    }
    .script-section {
      flex: 4;
      display: flex;
      width: 100%;
      max-width: 25%;
      .text {
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
        direction: rtl;
      }
    }
    .url-section {
      flex: 10;
      max-width: none;
    }

    .name-section {
      .brand {
        padding: 1px 3px;
        margin-top: -1px;
        background: rgba(0, 0, 0, 0.1);
        display: inline-block;
      }
      text-transform: capitalize;
    }
  }
}
</style>
