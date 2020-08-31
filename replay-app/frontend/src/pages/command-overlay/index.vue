<template lang="pug">
    .CommandOverlay.Page(:style="cssVars")
        h4.title {{commandLabel}}
        .resultBox(v-if="commandResult")
            .duration
                span.label duration:
                span.value {{commandResult.duration}} ms
            .result(v-if="commandResult.result")
                span.label result:
                span.value(:class="{error:commandResult.isError}") {{commandResult.result}}

</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { ipcRenderer } from "electron";
import NoCache from "~frontend/lib/NoCache";
import ICommandWithResult from "~shared/interfaces/ICommandResult";
import { OverlayStore } from "~frontend/models/OverlayStore";

@Component
export default class CommandOverlay extends Vue {
  public commandLabel: string = '';
  private commandResult: ICommandWithResult = {} as any;

  private store = new OverlayStore({ hideOnBlur: true, persistent: false });

  @NoCache
  private get cssVars() {
    return this.store.cssVars;
  }

  mounted() {
    ipcRenderer.on('will-show', (_, commandLabel: string, commandResult: ICommandWithResult) => {
      console.log(commandLabel, commandResult);
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
    .value {
      &.error {
        font-style: italic;
        color: #717171;
      }
    }
  }
}
</style>
