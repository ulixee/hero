<template lang="pug">
    .CommandOverlay.Page(:style="cssVars")
        h4.title {{commandLabel}}
        .resultBox(v-if="commandResult")
            .duration
                span.label duration:
                span.value {{duration}}
            .result(v-if="commandResult.result")
                span.label result:
                span.value(:class="{error:commandResult.isError}") {{commandResult.result}}

</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { ipcRenderer } from 'electron';
import NoCache from '~frontend/lib/NoCache';
import ICommandWithResult from '~shared/interfaces/ICommandResult';
import { OverlayStore } from '~frontend/models/OverlayStore';

@Component
export default class CommandOverlay extends Vue {
  public commandLabel: string = '';
  private commandResult: ICommandWithResult = {} as any;

  private store = new OverlayStore();

  get duration() {
    if (this.commandResult?.duration > 1000) {
      return `${Math.floor((this.commandResult.duration * 100) / 1000) / 100}s`;
    }
    return `${this.commandResult.duration}ms`;
  }

  @NoCache
  private get cssVars() {
    return this.store.cssVars;
  }

  mounted() {
    ipcRenderer.on('will-show', (_, commandLabel: string, commandResult: ICommandWithResult) => {
      this.commandLabel = commandLabel;
      this.commandResult = commandResult;
    });
  }
}
</script>

<style lang="scss">
@import '../../assets/style/overlay-mixins';
@import '../../assets/style/resets';
@include overlayBaseStyle();

.CommandOverlay {
  @include overlayStyle();
  box-shadow: 0 0 16px rgba(0, 0, 0, 0.12), 0 -4px 10px rgba(0, 0, 0, 0.16);
  margin-top: 16px;
  min-height: 100px;
  box-sizing: border-box;
  padding: 10px 25px 10px 15px;
  overflow: hidden;
  .title {
    margin-top: 5px;
    box-sizing: content-box;
    word-break: break-word;
    text-align: center;
  }
  .resultBox {
    font-size: 0.9em;
    margin-bottom: 5px;
    .label {
      color: #3c3c3c;
      font-style: italic;
      margin-right: 5px;
    }
    .value {
      word-break: break-word;
      &.error {
        font-style: italic;
        color: #717171;
      }
    }
  }
}
</style>
