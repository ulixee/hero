<template lang="pug">
    .Page(:style="cssVars")
        .CommandOverlay
            h4.title {{commandLabel}}
            .resultBox(v-if="commandResult" :class="{zoomImage:zoomImage}")
                .duration
                    span.label duration:
                    span.value {{duration}}
                .result(v-if="commandResult.resultType === 'image'"   @click="toggleZoom()")
                    img.value(:src="commandResult.result")
                .result(v-else-if="commandResult.result")
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
  private zoomImage = false;

  get duration() {
    if (!this.commandResult?.duration) return 'Pending';

    if (this.commandResult?.duration > 1000) {
      return `${Math.floor((this.commandResult.duration * 100) / 1000) / 100}s`;
    }
    return `${this.commandResult.duration}ms`;
  }

  @NoCache
  private get cssVars() {
    return this.store.cssVars;
  }

  private toggleZoom() {
    const willUnzoom = this.zoomImage;
    this.zoomImage = !this.zoomImage;
    ipcRenderer.send(willUnzoom ? 'zoomout-overlay' : 'zoomin-overlay');
  }

  mounted() {
    ipcRenderer.on('will-show', (_, commandLabel: string, commandResult: ICommandWithResult) => {
      this.zoomImage = false;
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

.Page {
  box-sizing: border-box;
}
.CommandOverlay {
  @include overlayStyle();
  box-shadow: 0 0 16px rgba(0, 0, 0, 0.12), 0 -4px 10px rgba(0, 0, 0, 0.16);
  margin-top: 16px;
  min-height: 100px;
  padding: 10px 0;

  .title {
    margin-top: 5px;
    box-sizing: content-box;
    word-break: break-word;
    text-align: center;
    padding: 0 25px 0 15px;
  }
  .resultBox {
    font-size: 0.9em;
    margin-bottom: 5px;
    max-height: 90%;
    padding: 0 25px 0 15px;

    .label {
      color: #3c3c3c;
      font-style: italic;
      margin-right: 5px;
    }
    img.value {
      margin-top: 10px;
      height: auto;
      width: 100%;
      margin-left: auto;
      margin-right: auto;
    }
    &.zoomImage {
      overflow-y: auto;
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
