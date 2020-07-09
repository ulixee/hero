<template lang="pug">
    .CommandOverlay.Page(:style="cssVars")
        h4.title {{store.commandLabel}}
        .resultBox
            .duration
                span.label duration:
                span.value {{store.commandResult.duration}} ms
            .result(v-if="store.commandResult.result")
                span.label result:
                span.value {{store.commandResult.result}}

</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'nuxt-class-component';
import { ipcRenderer } from 'electron';
import store from '~frontend/stores/command-overlay';
import NoCache from '~frontend/lib/NoCache';
import { Observer } from 'mobx-vue';

@Observer
@Component
export default class CommandOverlay extends Vue {
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

.CommandOverlay {
  @include overlayStyle();
  .title {
    margin: 20px;
    wrap-word: break-word;
    text-align: center;
  }
  .resultBox {
    margin: 20px;
    font-size: 0.9em;
    .label {
      color: #3c3c3c;
      font-style: italic;
      margin-right: 5px;
    }
  }
}
</style>
