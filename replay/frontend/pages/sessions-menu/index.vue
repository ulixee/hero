<template lang="pug">
  .SessionsMenu.Page(:style="cssVars")
    ul
      li(v-for="(session, index) of sessions") {{index + 1}} of {{sessions.length}}
</template>

<script lang="ts">
  import Vue from 'vue';
  import Component from 'nuxt-class-component';
  import { ipcRenderer } from 'electron';
  import store from '~frontend/stores/script-instances-menu';
  import Icon from '~frontend/components/Icon.vue';
  import NoCache from '~frontend/lib/NoCache';
  import ITabLocation from "~shared/interfaces/ITabLocation";

  @Component({ components: { Icon } })
  export default class SessionsMenu extends Vue {
    private sessions: any[] = [];

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
      this.sessions = await ipcRenderer.invoke('fetch-sessions');
    }
  }
</script>

<style lang="scss">
  @import "../../assets/style/overlay-mixins";
  @import "../../assets/style/resets";
  @include overlayBaseStyle();

  .SessionsMenu {
    @include overlayStyle();
    li {
      cursor: pointer;
    }
  }
</style>
