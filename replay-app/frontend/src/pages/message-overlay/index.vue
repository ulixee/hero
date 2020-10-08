<template lang="pug">
    .MessageOverlay.Page(:style="cssVars")
        h4.title {{title}}
        .message {{message}}
        button(@click="hide") Hide Message

</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import NoCache from '~frontend/lib/NoCache';
import { OverlayStore } from '~frontend/models/OverlayStore';
import { ipcRenderer } from 'electron';

@Component
export default class MessageOverlay extends Vue {
  store = new OverlayStore(false);
  title = '';
  message = '';
  id: string;

  @NoCache
  get cssVars() {
    return this.store.cssVars;
  }

  hide() {
    ipcRenderer.send('message-overlay:hide', this.store.webContentsId, this.id);
  }

  mounted() {
    ipcRenderer.on('will-show', (_, arg: { message: string; title: string; id: string }) => {
      this.title = arg.title;
      this.message = arg.message;
      this.id = arg.id;
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
  z-index: 100;
  .message {
    margin-bottom: 16px;
  }
  button {
    width: 100%;
    padding: 10px;
    margin: 16px 0 30px;
  }
}
</style>
