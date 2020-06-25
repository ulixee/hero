<template lang="pug">
.ScriptInstanceMenu.Page(:style="cssVars")
  ul
    li(v-for="instance of instances") {{instance.startDate}}
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
export default class ScriptInstanceMenu extends Vue {
  private instances: any[] = [];

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
    this.instances = await ipcRenderer.invoke('fetch-script-instances');
  }
}
</script>

<style lang="scss">
@import "../../assets/style/overlay-mixins";
@import "../../assets/style/resets";
@include overlayBaseStyle();

.ScriptInstanceMenu {
  @include overlayStyle();

}
</style>
