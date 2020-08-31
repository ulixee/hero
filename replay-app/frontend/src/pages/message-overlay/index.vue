<template lang="pug">
    .MessageOverlay.Page(:style="cssVars")
        h4.title {{store.title}}
        .message {{store.message}}

</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import NoCache from '~frontend/lib/NoCache';
import { OverlayStore } from '~frontend/models/OverlayStore';
import { ipcRenderer } from 'electron';

@Component
export default class MessageOverlay extends Vue {
  private store = new OverlayStore({ hideOnBlur: true, persistent: false });
  public title: string;

  public message: string;

  @NoCache
  private get cssVars() {
    return this.store.cssVars;
  }

  mounted() {
    ipcRenderer.on('will-show', (_, arg: { message: string; title: string }) => {
      this.message = arg.message;
      this.title = arg.title;
    });
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
