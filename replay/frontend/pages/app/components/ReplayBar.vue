<template lang="pug">
.ReplayBar.Component(:style="cssVars")
  button.start(v-if="!isPlaying" @click.prevent="play")
    span.label Start
    Icon(:src="ICON_PLAY" :size="14")
  button.start(v-if="isPlaying" @click.prevent="pause")
    span.label Stop
    Icon(:src="ICON_PAUSE" :size="14")
  .slider-wrapper(v-if="store.marks.length" ref="sliderWrapper")
    VueSlider(ref="slider" tooltip="none" :marks="store.marks" :duration="0" :min="0" :max="100" :dragOnClick="true" :hideLabel="true" v-model="store.selectedTab.currentTickValue" @change="onValueChange"
        @mousemove.native="showCommandOverlay")
        template(v-slot:mark="{ pos, value }" )
            .vue-slider-mark(:style="{ left: `${pos}%`, height:'100%', width:'4px' }", :class="{error:tickHasCommandResultError(value), hovered:isHovered(value)}")
                .vue-slider-mark-step
  .results
    | Results
</template>

<script lang="ts">
import { ipcRenderer } from 'electron';
import { Component, Vue } from 'nuxt-property-decorator';
import { Observer } from 'mobx-vue';
import Icon from '~frontend/components/Icon.vue';
import { TOOLBAR_HEIGHT } from '~shared/constants/design';
import { ICON_PLAY, ICON_PAUSE } from '~frontend/constants/icons';
import store from '~frontend/stores/app';
import NoCache from '~frontend/lib/NoCache';
import VueSlider from 'vue-slider-component';
import 'vue-slider-component/theme/default.css';
import { ITick } from '~shared/interfaces/ISaSession';

@Observer
@Component({ components: { Icon, VueSlider } })
export default class ReplayBar extends Vue {
  private readonly ICON_PLAY = ICON_PLAY;
  private readonly ICON_PAUSE = ICON_PAUSE;
  private store = store;

  private isPlaying = false;
  private hoveredValue: string = '';
  private interval: number;

  @NoCache
  private get cssVars() {
    return {
      '--toolbarHeight': `${TOOLBAR_HEIGHT}px`,
      '--toolbarBackgroundColor': store.theme.toolbarBackgroundColor,
    };
  }

  private pause() {
    this.isPlaying = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  private play() {
    this.isPlaying = true;
    clearInterval(this.interval);
    this.interval = setInterval(() => {
      if (this.store.selectedTab.currentTickValue + 0.1 > 100) {
        this.store.selectedTab.currentTickValue = 100;
      } else {
        this.store.selectedTab.currentTickValue += 0.1;
      }
      ipcRenderer.send('on-tick', this.store.selectedTab.currentTickValue);
    }, 20) as any;
  }

  private isHovered(value: number) {
    return this.hoveredValue === String(value);
  }

  private tickHasCommandResultError(mark: number) {
    const command = this.store.ticksByValue[mark];
    if (!command) return;
    const result = this.store.selectedTab.commandResults[command.commandId];
    if (result) {
      return result.isError;
    }
    return false;
  }

  private showCommandOverlay(e: MouseEvent) {
    const sliderRef = this.$refs.slider as VueSlider;
    sliderRef.setScale();
    // @ts-ignore
    const pos = sliderRef.getPosByEvent(e);

    const closest = this.closestTick(pos);

    const playbarOffsetPercent = closest.playbarOffsetPercent;
    this.hoveredValue = String(playbarOffsetPercent);

    const containerRect = sliderRef.$refs.container.getBoundingClientRect().toJSON();

    containerRect.x += Math.floor((containerRect.width * Number(playbarOffsetPercent)) / 100);

    ipcRenderer.send('on-tick-hover', containerRect, playbarOffsetPercent);
  }

  private onValueChange(value: number) {
    this.pause();
    ipcRenderer.send('on-tick', value);
  }

  private closestTick(pos: number) {
    let closest: ITick = store.ticks[0];
    let closestOffset = 100;
    for (const tick of store.ticks) {
      const offset = Math.abs(tick.playbarOffsetPercent - pos);
      if (offset < closestOffset) {
        closestOffset = offset;
        closest = tick;
      }
      if (offset > closestOffset) break;
    }
    return closest;
  }

  private beforeDestroy() {
    clearInterval(this.interval);
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
    .label {
      margin-right: 5px;
      vertical-align: top;
      font-size: 1.1em;
    }
  }

  .vue-slider-mark:first-child .vue-slider-mark-step,
  .vue-slider-mark:last-child .vue-slider-mark-step {
    display: block;
  }

  .vue-slider-mark {
    &.error {
      background-color: #710000;
    }
    .vue-slider-mark-step {
      height: 300%;
      margin-top: -100%;
      width: 2px;
    }
    &.hovered {
      .vue-slider-mark-step {
        background-color: #6b96c0;
        margin-top: -150%;
        height: 400%;
        width: 4px;
      }
    }
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
    }
  }
}
</style>
