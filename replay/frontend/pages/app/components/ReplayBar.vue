<template lang="pug">
.ReplayBar.Component(:style="cssVars")
  .start
    | Start
    Icon(:src="ICON_PLAY" :size="14")
  .slider-wrapper(v-if="store.marks.length")
    VueSlider(tooltip="none" :marks="store.marks" :included="true" :dragOnClick="true" :hideLabel="true" v-model="value" @change="onValueChange")
    //.current-position(:style="{ left: 0 }")
    //.snapshot(v-for="snapshot of snapshots" :style="{ left: `${snapshot.position}%` }")
  .results
    | Results
</template>

<script lang="ts">
import { ipcRenderer } from 'electron';
import { Component, Vue } from 'nuxt-property-decorator';
import { Observer } from 'mobx-vue';
import Icon from '~frontend/components/Icon.vue';
import { TOOLBAR_HEIGHT } from '~shared/constants/design';
import { ICON_PLAY } from '~frontend/constants/icons';
import store from '~frontend/stores/app';
import NoCache from '~frontend/lib/NoCache';
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/default.css'
import { toJS } from 'mobx';

@Observer
@Component({ components: { Icon, VueSlider } })
export default class ReplayBar extends Vue {
  private readonly ICON_PLAY = ICON_PLAY;
  private value = 0;
  private store = store;

  @NoCache
  private get cssVars() {
    return {
      '--toolbarHeight': `${TOOLBAR_HEIGHT}px`,
      '--toolbarBackgroundColor': store.theme.toolbarBackgroundColor,
    };
  }

  private onValueChange(value: string) {
    let paintEventIdx;
    const tick = store.ticksByValue[value];
    if (!tick) return;

    const paintEventTicks = tick.minorTicks.filter(t => t.paintEventIdx !== undefined)
    if (tick.minorTicks.length) {
      paintEventIdx = Math.max(...paintEventTicks.map(t => t.paintEventIdx));
    } else {
      paintEventIdx = this.findPreviousPaintEventIdx(tick);
    }
    if (paintEventIdx !== undefined) {
      ipcRenderer.send('replay-paint-event', paintEventIdx);
    }
  }

  private findPreviousPaintEventIdx(tick) {
    const startIndex = store.saSession.ticks.indexOf(tick);
    if (startIndex < 0) return undefined;

    for (let i = startIndex; i >= 0; i -= 1) {
      const tick = store.saSession.ticks[i];
      const paintEventTicks = tick.minorTicks.filter(t => t.paintEventIdx !== undefined)
      if (tick.minorTicks.length) {
        return Math.max(...paintEventTicks.map(t => t.paintEventIdx));
      }
    }
  }
}
</script>

<style lang="scss">
.ReplayBar {
  margin: 0 7px;
  position: relative;
  z-index: 100;
  display: flex;
  align-items: center;
  flex-flow: row;
  color: rgba(0, 0, 0, 0.8);
  width: calc(100% - 14px);
  height: var(--toolbarHeight);
  background-color: var(--toolbarBackgroundColor);

  .start {
    white-space: nowrap;
  }

  .vue-slider-mark:first-child .vue-slider-mark-step, .vue-slider-mark:last-child .vue-slider-mark-step {
    display: block;
  }

  .vue-slider-mark-step {
    height: 300%;
    margin-top: -100%;
    width: 2px;
  }

  .slider-wrapper {
    width: 100%;
    position: relative;
    margin: 0 15px;

    .other {
      &:before {
        content: '';
        position: absolute;
        background: #979797;
        height: 4px;
        left: 0;
        width: 100%;
        top: calc(50% - 2px);
      }

      .current-position {
        border: 1px solid rgba(0, 0, 0, 0.3);
        background: var(--toolbarBackgroundColor);
        width: 14px;
        height: 14px;
        border-radius: 50%;
        position: absolute;
        top: calc(50% - 8px);
      }

      .snapshot {
        background: #979797;
        width: 1px;
        height: 16px;
        position: absolute;
        top: calc(50% - 8px);
        z-index: 2;

        &:before,
        &:after {
          content: '';
          position: absolute;
          left: 0;
          width: 1px;
          height: 1px;
          background: var(--toolbarBackgroundColor);
        }

        &:before {
          top: 5px;
        }

        &:after {
          top: 10px;
        }
      }
    }
  }
}
</style>
