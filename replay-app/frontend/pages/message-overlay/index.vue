<template lang="pug">
    .MessageOverlay.Page(:style="cssVars")
        h4.title {{store.title}}
        .message {{store.message}}

</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'nuxt-class-component';
import store from '~frontend/stores/message-overlay';
import NoCache from '~frontend/lib/NoCache';
import { Observer } from 'mobx-vue';

@Observer
@Component
export default class MessageOverlay extends Vue {
  private store = store;

  @NoCache
  private get cssVars() {
    const dialogLightForeground = store.theme.dialogLightForeground;
    return {
      '--dropdownBackgroundColor': store.theme.dropdownBackgroundColor,
      '--menuItemHoverBackgroundColor': dialogLightForeground
        ? 'rgba(255, 255, 255, 0.06)'
        : 'rgba(0, 0, 0, 0.03)',
    };
  }
}
</script>

<style lang="scss">
@import '../../assets/style/overlay-mixins';
@import '../../assets/style/resets';
@include overlayBaseStyle();

.MessageOverlay {
  @include overlayStyle();
  opacity: 0.8;
  padding: 10px;
  text-align: center;
}
</style>
