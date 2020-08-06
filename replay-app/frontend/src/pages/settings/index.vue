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
import Vue from 'vue';
import Component from 'vue-class-component';
import store from '@/stores/settings';

@Component({ components: {} })
export default class SettingsPage extends Vue {
  private theme = store.settings.themeAuto ? 'auto' : store.settings.theme;

  private onThemeChange($event: any) {
    console.log('onThemeChange');
  }
}
</script>
