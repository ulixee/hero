<template lang="pug">
.MainMenuScreen.Page(:style="cssVars")
  QuickMenu
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import QuickMenu from './components/QuickMenu.vue';
import store from '~frontend/stores/main-menu';
import NoCache from '~frontend/lib/NoCache';

@Component({ components: { QuickMenu } })
export default class MainMenuScreen extends Vue {

  @NoCache
  private get cssVars() {
    return {
      '--dropdownBackgroundColor': store.theme.dropdownBackgroundColor,
    }
  }
}
</script>

<style lang="scss">
@import "../../assets/style/overlay-mixins";
@include overlayBaseStyle();

.MainMenuScreen {
  @include overlayStyle();
}
</style>
