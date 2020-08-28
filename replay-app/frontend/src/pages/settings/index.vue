<template lang="pug">
.SettingsPage
  .container
    .drawer-header
      .drawer-title Basic Settings
    .row
    .title Theme variant
    select(v-model="theme" @change="onThemeChange")
      option(value="auto") Auto
      option(value="secret-agent-light") Light
      option(value="secret-agent-dark") Dark
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { remote } from "electron";
import { getTheme } from "~shared/utils/themes";
import settings from '~frontend/lib/settings';

@Component({ components: {} })
export default class SettingsPage extends Vue {

  public windowId = remote.getCurrentWindow().id;

  private onThemeChange($event: any) {
    console.log('onThemeChange');
  }

  public get theme() {
    if (settings.themeAuto) return 'auto';
    return getTheme(settings.theme);
  }
}
</script>
