<template lang="pug">
.LocationsMenuScreen.Page(:style="cssVars")
  ul
    li(@click="navigateToHistory(item)" v-for="item of history")
      Icon(:src="ICON_SCRIPT" :size=16 iconStyle="transform: 'scale(-1,1)'")
      .text {{scriptName(item)}}
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { ipcRenderer } from 'electron';
import { ICON_SCRIPT } from '~frontend/constants/icons';
import Icon from '~frontend/components/Icon.vue';
import NoCache from '~frontend/lib/NoCache';
import { OverlayStore } from '~frontend/models/OverlayStore';
import Path from 'path';

@Component({ components: { Icon } })
export default class LocationsMenuScreen extends Vue {
  private store = new OverlayStore();
  private history = [];
  readonly ICON_SCRIPT = ICON_SCRIPT;

  private navigateToHistory(item) {
    ipcRenderer.send(`navigate-to-history`, item);
    this.store.hide();
  }

  private scriptName(item) {
    return item.scriptEntrypoint
      .split(Path.sep)
      .filter(Boolean)
      .slice(-2)
      .join('/');
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
  ul {
    @include reset-ul();
    padding-top:5px;
    margin: 0;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;

    li {
      box-sizing: border-box;
      padding-left: 10px;
      padding-right: 10px;
      align-items: center;
      margin: 0;
      flex: 1;
      display: flex;
      border-bottom: 1px solid #eee;
      cursor: pointer;
      pointer-events: bounding-box;

      .text {
        cursor: pointer;
        padding: 5px 0;
        flex: 1;
        margin-left: 5px;
      }
      .Icon {
        cursor: pointer;
        width: 20px;
      }
    }
  }
}
</style>
