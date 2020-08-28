<template lang="pug">
.MainMenuScreen.Page(:style="cssVars")
  QuickMenu
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import QuickMenu from './components/QuickMenu.vue';
import NoCache from '~frontend/lib/NoCache';
import { OverlayStore } from '~frontend/models/OverlayStore';

@Component({ components: { QuickMenu } })
export default class MainMenuScreen extends Vue {
  private store = new OverlayStore();

  @NoCache
  private get cssVars() {
    return this.store.cssVars;
  }
}
</script>

<style lang="scss">
@import '../../assets/style/overlay-mixins';
@include overlayBaseStyle();

.MainMenuScreen {
  @include overlayStyle();
}
</style>
