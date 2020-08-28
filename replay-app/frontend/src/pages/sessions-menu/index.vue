<template lang="pug">
  .SessionsMenu.Page(:style="cssVars")
    ul
      li(v-for="(session, index) of sessions") {{index+1}}) {{session.name}}
</template>

<script lang="ts">
import Vue from 'vue';
import { ipcRenderer } from 'electron';
import Component from 'vue-class-component';
import Icon from '~frontend/components/Icon.vue';
import NoCache from '~frontend/lib/NoCache';
import { OverlayStore } from '~frontend/models/OverlayStore';

@Component({ components: { Icon } })
export default class SessionsMenu extends Vue {
  public sessions: any[] = [];

  private store = new OverlayStore();

  @NoCache
  private get cssVars() {
    return this.store.cssVars;
  }

  async mounted() {
    this.sessions = await ipcRenderer.invoke('fetch-sessions');

    ipcRenderer.on('will-show', async () => {
      this.sessions = await ipcRenderer.invoke('fetch-sessions');
    });
  }
}
</script>

<style lang="scss">
@import '../../assets/style/overlay-mixins';
@import '../../assets/style/resets';
@include overlayBaseStyle();

.SessionsMenu {
  @include overlayStyle();
}
</style>
