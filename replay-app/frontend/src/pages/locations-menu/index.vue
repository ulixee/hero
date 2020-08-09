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
import store from '~frontend/stores/locations-menu';
import Icon from '~frontend/components/Icon.vue';
import NoCache from '~frontend/lib/NoCache';
import { ICON_HOME, ICON_SETTINGS, ICON_HISTORY } from '~frontend/constants/icons';
import ITabLocation from '~shared/interfaces/ITabLocation';

@Component({ components: { Icon } })
export default class LocationsMenuScreen extends Vue {
  private ICON_HOME = ICON_HOME;
  private ICON_SETTINGS = ICON_SETTINGS;
  private ICON_HISTORY = ICON_HISTORY;
  private history = [];

  private gotoLocation(location: ITabLocation) {
    ipcRenderer.send(`navigate-to-location`, location, true);
    store.hide();
  }

  private navigateToHistory(item) {
    ipcRenderer.send(`navigate-to-history`, item, true);
    store.hide();
  }

  @NoCache
  private get cssVars() {
    const dialogLightForeground = store.theme.dialogLightForeground;
    return {
      '--dropdownBackgroundColor': store.theme.dropdownBackgroundColor,
      '--menuItemHoverBackgroundColor': dialogLightForeground
        ? 'rgba(255, 255, 255, 0.06)'
        : 'rgba(0, 0, 0, 0.03)',
    };
  }

  async mounted() {
    this.history = await ipcRenderer.invoke('fetch-history');
  }
}
</script>

<style lang="scss">
@import '../../assets/style/overlay-mixins';
@import '../../assets/style/resets';
@include overlayBaseStyle();

.LocationsMenuScreen {
  padding: 10px;
  @include overlayStyle();
  ul {
    @include reset-ul();
    li {
        cursor: pointer;
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
      margin-top: 5px;
      &:hover {
        background-color: var(--menuItemHoverBackgroundColor);
      }
    }
  }
}
</style>
