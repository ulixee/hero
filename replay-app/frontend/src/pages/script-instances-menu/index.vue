<template lang="pug">
.ScriptInstanceMenu.Page(:style="cssVars")
  ul
    li(v-for="instance of instances" @click="navigateToHistory(instance)" :class="{active:instance.isActive}") {{instance.startDate}}
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { ipcRenderer } from 'electron';
import Icon from '~frontend/components/Icon.vue';
import NoCache from '~frontend/lib/NoCache';
import { OverlayStore } from '~frontend/models/OverlayStore';

@Component({ components: { Icon } })
export default class ScriptInstanceMenu extends Vue {
  private store = new OverlayStore();

  private instances: {
    startDate: string;
    scriptInstanceId: string;
    dataLocation: string;
    sessionName: string;
    isActive: boolean;
  }[] = [];

  private navigateToHistory(item) {
    const { dataLocation, sessionName, scriptInstanceId } = item;
    ipcRenderer.send(`navigate-to-history`, { dataLocation, scriptInstanceId, sessionName }, true);
    this.store.hide();
  }

  @NoCache
  private get cssVars() {
    return this.store.cssVars;
  }

  async mounted() {
    this.instances = await ipcRenderer.invoke('fetch-script-instances');

    ipcRenderer.on('will-show', async () => {
      this.instances = await ipcRenderer.invoke('fetch-script-instances');
    });
  }
}
</script>

<style lang="scss">
@import '../../assets/style/overlay-mixins';
@import '../../assets/style/resets';
@include overlayBaseStyle();

.ScriptInstanceMenu {
  @include overlayStyle();
}
</style>
