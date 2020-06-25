<template lang="pug">
  .SessionPagesMenu.Page(:style="cssVars")
    ul
      li(v-for="page of pages") {{page.url}}
</template>

<script lang="ts">
  import Vue from 'vue';
  import Component from 'nuxt-class-component';
  import { ipcRenderer } from 'electron';
  import store from '~frontend/stores/script-instances-menu';
  import Icon from '~frontend/components/Icon.vue';
  import NoCache from '~frontend/lib/NoCache';

  @Component({ components: { Icon } })
  export default class SessionPagesMenu extends Vue {
    private pages: any[] = [];

    @NoCache
    private get cssVars() {
      const dialogLightForeground = store.theme.dialogLightForeground;
      return {
        '--dropdownBackgroundColor': store.theme.dropdownBackgroundColor,
        '--menuItemHoverBackgroundColor': dialogLightForeground
          ? 'rgba(255, 255, 255, 0.06)'
          : 'rgba(0, 0, 0, 0.03)',
      }
    }
    async mounted() {
      this.pages = await ipcRenderer.invoke('fetch-session-pages');
    }
  }
</script>

<style lang="scss">
  @import "../../assets/style/overlay-mixins";
  @import "../../assets/style/resets";
  @include overlayBaseStyle();

  .SessionPagesMenu {
    @include overlayStyle();

  }
</style>
