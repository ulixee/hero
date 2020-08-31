<template lang="pug">
.LocationsMenuScreen.Page(:style="cssVars")
  ul
    li(@click="gotoLocation('Home')")
      Icon(:src="ICON_HOME" :size=16 )
      .text Home
    li(@click="gotoLocation('Settings')")
      Icon(:src="ICON_SETTINGS")
      .text Settings
    li(@click="gotoLocation('History')")
      Icon(:src="ICON_HISTORY" :size=16 iconStyle="transform: 'scale(-1,1)'")
      .text History
  h3 Recently Opened Scripts
  ul
    li(@click="navigateToHistory(item)" v-for="item of history")
      .text {{item.scriptEntrypoint}}
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { ipcRenderer } from 'electron';
import Icon from '~frontend/components/Icon.vue';
import NoCache from '~frontend/lib/NoCache';
import { ICON_HISTORY, ICON_HOME, ICON_SETTINGS } from '~frontend/constants/icons';
import ITabLocation from '~shared/interfaces/ITabLocation';
import { OverlayStore } from '~frontend/models/OverlayStore';

@Component({ components: { Icon } })
export default class LocationsMenuScreen extends Vue {
  private store = new OverlayStore();
  private ICON_HOME = ICON_HOME;
  private ICON_SETTINGS = ICON_SETTINGS;
  private ICON_HISTORY = ICON_HISTORY;
  private history = [];

  private gotoLocation(location: ITabLocation) {
    ipcRenderer.send(`navigate-to-location`, location, true);
    this.store.hide();
  }

  private navigateToHistory(item) {
    ipcRenderer.send(`navigate-to-history`, item, true);
    this.store.hide();
  }

  @NoCache
  private get cssVars() {
    return this.store.cssVars;
  }

  async mounted() {
    this.history = await ipcRenderer.invoke('fetch-history');

    ipcRenderer.on('will-show', async () => {
      this.history = await ipcRenderer.invoke('fetch-history');
    });
  }
}
</script>

<style lang="scss">
@import '../../assets/style/overlay-mixins';
@import '../../assets/style/resets';
@include overlayBaseStyle();

.LocationsMenuScreen {
  @include overlayStyle();
  h3 {
    margin: 20px 10px 0;
  }
  ul {
    @include reset-ul();
    margin: 10px 0 0;
    li {
      padding-left: 10px;
      margin: 0;
      .text {
        display: inline-block;
        line-height: 16px;
        margin-left: 5px;
        vertical-align: top;
      }
      .Icon {
        display: inline-block;
        width: 16px;
        height: 16px;
        background-size: contain;
        background-position: center;
      }
      &:hover {
        background-color: var(--menuItemHoverBackgroundColor);
      }
    }
  }
}
</style>
