import { ipcRenderer } from "electron";
<template lang="pug">
  .SessionPagesMenu.Page(:style="cssVars")
    ul
      li.page(v-for="page of pages" :class="{active:page.isActive}" @click="navigateToScriptPage(page)") {{page.url}}
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import Icon from '~frontend/components/Icon.vue';
import NoCache from '~frontend/lib/NoCache';
import { ipcRenderer } from 'electron';
import { OverlayStore } from '~frontend/models/OverlayStore';

@Component({ components: { Icon } })
export default class SessionPagesMenu extends Vue {
  private store = new OverlayStore();
  private pages: { id: string; url: string; isActive: boolean }[] = [];

  private navigateToScriptPage(page) {
    ipcRenderer.send(`navigate-to-session-page`, { id: page.id, url: page.url });
    this.store.hide();
  }

  @NoCache
  private get cssVars() {
    return this.store.cssVars;
  }

  async mounted() {
    this.pages = await ipcRenderer.invoke('fetch-session-pages');

    ipcRenderer.on('will-show', async () => {
      this.pages = await ipcRenderer.invoke('fetch-session-pages');
    });
  }
}
</script>

<style lang="scss">
@import '../../assets/style/overlay-mixins';
@import '../../assets/style/resets';
@include overlayBaseStyle();

.SessionPagesMenu {
  @include overlayStyle();
}
</style>
