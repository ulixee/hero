<template lang="pug">
.HeaderPage.Page(:style="cssVars")
  .NavBar
    .left-buttons
      AppButton(
        @click="back"
        :autoInvert="true"
        :disabled="!hasBack"
        :icon="ICON_BACK"
        :size=18
      )
    .location(ref="location")
      template(v-if="heroSession")
        .script-section.section(@mousedown="showLocationOverlay($event, 'locations-menu')")
          Icon(:src="ICON_SCRIPT" :size=16 iconStyle="transform: 'scale(-1,1)'")
          .text {{scriptName}}
        .session-section.section(@mousedown="showLocationOverlay($event, 'script-instances-menu')")
          Icon(:src="ICON_CLOCK" :size=16 iconStyle="transform: 'scale(-1,1)'")
          .text {{scriptInstanceDate}}
        .window-section.section(@mousedown="showLocationOverlay($event, 'sessions-menu')" v-if="heroSession.relatedSessions.length > 1")
          Icon(:src="ICON_NUMBER" :size=16 iconStyle="transform: 'scale(-1,1)'")
          .text ({{sessionIndex}} of {{heroSession.relatedSessions.length}}) {{sessionName}}
      template(v-else-if="location")
        .name-section.section(@mousedown="showLocationOverlay($event, 'locations-menu')")
          .text Hero

    .right-buttons
      AppButton(
        @click="forward"
        :autoInvert="true"
        :disabled="!hasNext"
        :icon="ICON_FORWARD"
        :size=18
      )
  .UrlBar(v-if="heroSession")
    button(v-if="heroSession.tabs.length > 1" @click="showTabs" ref="tabRef")
      .text {{activeTabIdx + 1}}/{{heroSession.tabs.length}}
    .address-bar
      Icon(:src="addressIcon" :size=16 iconStyle="transform: 'scale(-1,1)'" disabled="true")
      .detached(v-if="isFrozenTab") Frozen
      .text {{currentUrl}}

</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { ipcRenderer } from 'electron';
import { TOOLBAR_HEIGHT } from '~shared/constants/design';
import {
  ICON_BACK,
  ICON_CLOCK,
  ICON_FORWARD,
  ICON_LOCK,
  ICON_NUMBER,
  ICON_SCRIPT,
  ICON_WINDOW,
  ICON_BOOKMARK,
} from '~frontend/constants/icons';
import NoCache from '~frontend/lib/NoCache';
import Icon from '~frontend/components/Icon.vue';
import os from 'os';
import IWindowLocation from '~shared/interfaces/IWindowLocation';
import { dateToTimeAgo } from '~shared/utils/formatters';
import AppButton from '~frontend/pages/header/components/AppButton.vue';
import IHeroSession from '~shared/interfaces/IheroSession';
import { getTheme } from '~shared/utils/themes';
import moment from 'moment';
import Path from 'path';
import settings from '~frontend/lib/settings';

@Component({ components: { AppButton, Icon } })
export default class HeaderPage extends Vue {
  readonly ICON_BACK = ICON_BACK;
  readonly ICON_FORWARD = ICON_FORWARD;
  readonly ICON_SCRIPT = ICON_SCRIPT;
  readonly ICON_CLOCK = ICON_CLOCK;
  readonly ICON_NUMBER = ICON_NUMBER;
  readonly ICON_LOCK = ICON_LOCK;
  readonly ICON_BOOKMARK = ICON_BOOKMARK;
  readonly ICON_WINDOW = ICON_WINDOW;

  $refs: any;
  tabRef: HTMLElement;
  isFullscreen = false;
  activeTabId = 0;

  currentUrl = 'Loading';

  location: IWindowLocation = 'Dashboard';

  heroSession: IHeroSession = null;
  hasBack = false;
  hasNext = false;

  get isFrozenTab(): boolean {
    if (!this.activeTabId) return false;
    return !!this.heroSession.tabs.find(x => x.tabId === this.activeTabId)?.detachedFromTabId;
  }

  get addressIcon() {
    if (this.isFrozenTab) return ICON_BOOKMARK;
    return ICON_LOCK;
  }

  get sessionIndex() {
    return this.heroSession.relatedSessions.findIndex(x => x.id === this.heroSession.id) + 1;
  }

  get sessionName() {
    let name = this.heroSession.name;
    if (name.length > 30) {
      return name.substr(0, 30) + '... ';
    }
    return name;
  }

  get activeTabIdx() {
    return this.heroSession.tabs.findIndex(x => x.tabId === this.activeTabId);
  }

  mounted() {
    ipcRenderer.on('location:updated', (e, args) => {
      const { location, heroSession, hasNext, hasBack } = args;
      console.log('location:updated', args);
      this.location = location ?? null;
      this.heroSession = heroSession ?? null;
      this.hasNext = hasNext;
      this.hasBack = hasBack;
    });

    ipcRenderer.on('replay:tab', (e, tab) => {
      const index = this.heroSession.tabs.findIndex(x => x.tabId === tab.tabId);
      if (index === -1) this.heroSession.tabs.push(tab);
      else this.heroSession.tabs[index] = tab;
    });

    ipcRenderer.on('replay:active-tab', (e, tabId) => {
      this.activeTabId = tabId;
    });

    ipcRenderer.on('replay:page-url', (e, url) => {
      this.currentUrl = url;
    });

    ipcRenderer.on('fullscreen', (e, fullscreen: boolean) => {
      this.isFullscreen = fullscreen;
    });
  }

  get scriptInstanceDate() {
    if (
      this.heroSession.relatedScriptInstances?.length &&
      this.heroSession.scriptStartDate === this.heroSession.relatedScriptInstances[0].startDate
    ) {
      return 'Latest';
    }
    return dateToTimeAgo(this.heroSession.scriptStartDate);
  }

  get scriptName() {
    return this.heroSession.scriptEntrypoint.split(Path.sep).filter(Boolean).slice(-2).join('/');
  }

  @NoCache
  get cssVars() {
    const theme = getTheme(settings.theme);
    return {
      '--addressBarBackgroundColor': theme.addressBarBackgroundColor,
      '--addressBarTextColor': theme.addressBarTextColor,
      '--paddingLeft': (this.isMac() && !this.isFullscreen ? 78 : 4) + 'px',
      '--toolbarLightForeground': theme.toolbarLightForeground || '1px solid rgba(0, 0, 0, 0.12)',
      '--toolbarHeight': `${TOOLBAR_HEIGHT}px`,
      '--toolbarBackgroundColor': theme.toolbarBackgroundColor,
      '--toolbarBorderBottomColor': theme.toolbarBottomLineBackgroundColor,
      '--navbarWidth': this.heroSession?.relatedSessions?.length > 1 ? '60%' : '40%',
    };
  }

  isMac() {
    return os.platform() === 'darwin';
  }

  back() {
    ipcRenderer.send('go-back');
  }

  forward() {
    ipcRenderer.send('go-forward');
  }

  showTabs() {
    const overlayRect = this.$refs.tabRef.getBoundingClientRect().toJSON();

    const firstTabTime = moment(this.heroSession.tabs[0].createdTime);
    let tabLabelsById = new Map<number, string>();
    let tabCounter = 0;
    const tabs = this.heroSession.tabs.map((x, i) => {
      let label = '';
      let time = '';
      if (tabCounter === 1) label = '2nd ';
      else if (tabCounter === 2) label = '3rd ';
      else if (tabCounter > 2) label = `${i + 1}th `;

      if (i === 0) {
        time = firstTabTime.format('h:mma');
      } else {
        const newMoment = moment(x.createdTime);
        const millis = newMoment.diff(firstTabTime, 'milliseconds');
        if (millis < 1e3) {
          time = `+${millis}ms`;
        } else {
          const secs = newMoment.diff(firstTabTime, 'seconds', true);
          time = `+${secs}s`;
        }
      }
      let title: string;
      if (!x.detachedFromTabId) {
        title = `${i + 1}/${this.heroSession.tabs.length} - ${label}tab opened at ${time}`;
        tabLabelsById.set(x.tabId, label || '1st ');
        tabCounter += 1;
      } else {
        const sourceTabNumber = tabLabelsById.get(x.detachedFromTabId);
        title = `${i + 1}/${
          this.heroSession.tabs.length
        } - detached ${sourceTabNumber}tab at ${time}`;
      }

      return {
        title,
        isActive: this.activeTabId === x.tabId,
        id: x.tabId,
      };
    });
    overlayRect.y += 3;
    overlayRect.width = 500;
    ipcRenderer.send(
      'overlay:show',
      'list-menu',
      overlayRect,
      tabs,
      'ICON_WINDOW',
      'navigate-to-session-tab',
    );
  }

  showLocationOverlay(e: any, name) {
    const overlayRect = e.target.getBoundingClientRect().toJSON();
    const parentRect = this.$refs.location.getBoundingClientRect();
    const parentWidth = this.$refs.location.getBoundingClientRect().width;
    const fromLeft = overlayRect.left - parentRect.left;
    if (name === 'locations-menu') {
      overlayRect.width = parentWidth;
      overlayRect.x -= fromLeft;
      return ipcRenderer.send('overlay:toggle', name, overlayRect);
    }

    overlayRect.width = parentWidth - fromLeft;

    if (name === 'script-instances-menu') {
      const instances = this.heroSession.relatedScriptInstances.map((x, i) => {
        return {
          id: x.id,
          title: i === 0 ? 'Latest' : dateToTimeAgo(x.startDate),
          scriptInstanceId: x.id,
          isActive: this.heroSession.scriptInstanceId === x.id,
          dataLocation: this.heroSession.dataLocation,
          sessionName: this.heroSession.name,
        };
      });
      ipcRenderer.send(
        'overlay:show',
        'list-menu',
        overlayRect,
        instances,
        'ICON_CLOCK',
        'navigate-to-history',
      );
    } else if (name === 'sessions-menu') {
      ipcRenderer.send(
        'overlay:show',
        'list-menu',
        overlayRect,
        this.heroSession.relatedSessions.map((x, i) => ({
          id: x.id,
          title: x.name,
          isActive: this.heroSession.name === x.name,
          name: x.name,
        })),
        'ICON_NUMBER',
        'navigate-to-session',
      );
    }
  }
}
</script>

<style lang="scss">
@import '../../assets/style/common-mixins';
@include baseStyle();
.HeaderPage {
  background-color: var(--toolbarBackgroundColor);
  -webkit-app-region: drag;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.8);
  padding-top: 2px;
  padding-bottom: 2px;
  box-sizing: border-box;

  .NavBar {
    display: flex;
    align-items: center;
    margin: 0 auto;
    width: var(--navbarWidth);
    min-width: 400px;
    position: relative;
    z-index: 2;
    top: 10px;
    background: white;
    cursor: pointer;
    color: rgba(0, 0, 0, 0.8);
    box-shadow: 0 0 1px rgba(0, 0, 0, 0.12), 0 1px 1px rgba(0, 0, 0, 0.16);
    border: 1px solid rgba(0, 0, 0, 0.2);
    height: 30px;
    overflow: hidden;
    border-radius: 3px;
    -webkit-app-region: no-drag;

    .left-buttons {
      width: 30px;
      border-right: 1px solid rgba(0, 0, 0, 0.1);
    }

    .right-buttons {
      width: 30px;
      border-left: 1px solid rgba(0, 0, 0, 0.1);
      position: relative;
    }

    .location {
      cursor: pointer;
      flex: 10;
      display: flex;
      height: 100%;
      align-items: center;
      color: var(--addressBarTextColor);

      .section {
        display: flex;
        flex: 1;
        cursor: pointer;
        position: relative;
        align-items: center;
        height: 100%;
        font-size: 13px;
        white-space: nowrap;
        border-left: 1px solid rgba(0, 0, 0, 0.1);
        .text {
          pointer-events: none;
          cursor: pointer;
          padding-left: 5px;
        }
        .Icon {
          pointer-events: none;
          cursor: pointer;
          margin-top: 1px;
          vertical-align: middle;
          width: 20px;
          margin-left: 10px;
        }
        &:first-child {
          border-left: none;
        }
        &:hover {
          background: rgba(0, 0, 0, 0.05);
        }
        &.name-section {
          justify-content: center;
        }
      }
    }
  }

  .UrlBar {
    flex: 1;
    display: flex;
    align-items: stretch;
    margin: 3px 10px 6px;
    -webkit-app-region: no-drag;
    button {
      margin-left: 0;
      min-width: 36px;
      margin-right: 5px;
      font-weight: bold;
      border: 1px solid var(--toolbarBorderBottomColor);
      border-radius: 4px;
      padding: 4px 10px;
      cursor: pointer;
    }
    .detached {
      margin: auto 5px;
      padding: 0 5px;
      background: #3498db;
      line-height: 20px;
      color: white;
      height: 20px;
      border-radius: 5px;
      font-size: 10px;
      vertical-align: middle;
    }
    .address-bar {
      flex: 10;
      display: flex;
      align-items: center;
      pointer-events: none;
      position: relative;
      font-size: 15px;
      overflow: hidden;
      height: 30px;
      border-radius: 5px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      background-color: #fafafa;
      box-shadow: 0 0 2px 0 rgba(0, 0, 0, 0.1);
      padding-left: 10px;

      .text {
        padding-left: 5px;
        font-weight: lighter;
        color: #676767;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      .Icon {
        margin-top: 1px;
        width: 16px;
        height: 13px;
        flex: 0 0 auto;
      }
    }
  }
}
</style>
