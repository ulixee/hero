<template lang="pug">
  .FooterPage.Page
    .Playbar.Component(:style="cssVars")
      button.start(v-if="!isPlaying" @click.prevent="play")
        span.label Start
        Icon(:src="ICON_PLAY" :size="14")
      button.start(v-if="isPlaying" @click.prevent="pause")
        span.label Stop
        Icon(:src="ICON_PAUSE" :size="14")
      .slider-wrapper(ref="sliderWrapper")
        VueSlider(ref="slider" tooltip="none" :marks="ticks" :interval="0.01" :duration="0" :min="0" :max="100" :dragOnClick="true" :hideLabel="true" v-model="currentTickValue" @change="onValueChange"
          @mousemove.native="onHoverPlaybar")
          template(v-slot:mark="{ pos, value }" )
            .vue-slider-mark(:style="{ left: `${pos}%`, height:'100%', width:'4px' }", :class="{hovered:isHovered(value)}")
              .vue-slider-mark-step
      button.output(@click.prevent="toggleOutput" :class="{selected:isShowingOutput}")
        span.label Output
        Icon(:src="ICON_BRACKETS" :size="14" )
</template>

<script lang="ts">
import { ipcRenderer } from 'electron';
import { Component, Vue } from 'vue-property-decorator';
import Icon from '~frontend/components/Icon.vue';
import { TOOLBAR_HEIGHT } from '~shared/constants/design';
import { ICON_PAUSE, ICON_PLAY, ICON_BRACKETS } from '~frontend/constants/icons';
import NoCache from '~frontend/lib/NoCache';
import VueSlider from 'vue-slider-component';
import 'vue-slider-component/theme/default.css';
import ITickState from '~shared/interfaces/ITickState';
import { getTheme } from '~shared/utils/themes';
import settings from '~frontend/lib/settings';

// @ts-ignore
@Component({ components: { Icon, VueSlider } })
export default class Playbar extends Vue {
  private readonly ICON_PLAY = ICON_PLAY;
  private readonly ICON_BRACKETS = ICON_BRACKETS;
  private readonly ICON_PAUSE = ICON_PAUSE;

  private hoveredValue = '';
  private durationMillis = 0;
  private ticks: number[] = [];
  private currentTickValue = 0;
  private tickRealtimeOffsetMs = 0;
  private isPlaying = false;

  private nextTimeout: number;
  private isShowingOutput = true;

  private get theme() {
    return getTheme(settings.theme);
  }

  @NoCache
  private get cssVars() {
    return {
      '--toolbarHeight': `${TOOLBAR_HEIGHT - 2}px`,
      '--toolbarBackgroundColor': this.theme.toolbarBackgroundColor,
      '--toolbarBorderColor': this.theme.toolbarBottomLineBackgroundColor,
      '--toolbarLightForeground':
        this.theme.toolbarLightForeground || '1px solid rgba(0, 0, 0, 0.12)',
      '--toolbarBorderBottomColor': this.theme.toolbarBottomLineBackgroundColor,
    };
  }

  mounted() {
    ipcRenderer.on('ticks:load', (e, tickState: ITickState) => {
      console.log('ticks:load', tickState);
      this.pause();
      this.currentTickValue = tickState.currentTickOffset ?? 0;
      this.loadTickState(tickState);
    });

    ipcRenderer.on('ticks:change-offset', (e, offset: number) => {
      this.currentTickValue = offset;
      const playbarOffsetPercent = this.closestTick(offset);
      this.hoverTick(playbarOffsetPercent);
    });

    ipcRenderer.on('start', () => {
      this.play();
    });

    ipcRenderer.on('ticks:updated', (e, tickState: ITickState) => {
      console.log('ticks:updated', tickState);

      const startSessionMillis = this.durationMillis;
      this.loadTickState(tickState);

      if (startSessionMillis && this.currentTickValue) {
        if (this.durationMillis < startSessionMillis) {
          this.currentTickValue *= this.durationMillis / startSessionMillis;
        } else {
          this.currentTickValue *= startSessionMillis / this.durationMillis;
        }
      }
    });
  }

  private loadTickState(tickState: ITickState) {
    this.ticks = tickState.ticks;
    this.durationMillis = tickState.durationMillis;
  }

  private play() {
    this.tickRealtimeOffsetMs = 0;
    this.isPlaying = true;
    this.playbackTick();
  }

  private async playbackTick() {
    const next = await ipcRenderer.invoke('next-tick', this.tickRealtimeOffsetMs ?? 0);
    this.currentTickValue = next.playbarOffset || 0;
    let millisToNextTick = Number(next.millisToNextTick || 0);

    console.log(
      'Playbar at %s. Next tick in %s. Previous offset of %s',
      this.currentTickValue,
      millisToNextTick,
      this.tickRealtimeOffsetMs,
    );
    if (millisToNextTick < 0) {
      this.tickRealtimeOffsetMs = millisToNextTick;
      millisToNextTick = 0;
    } else {
      this.tickRealtimeOffsetMs = 0;
    }
    if (this.currentTickValue === 100) {
      this.isPlaying = false;
    }

    if (this.isPlaying) {
      this.nextTimeout = setTimeout(this.playbackTick.bind(this), millisToNextTick) as any;
    }
  }

  private pause() {
    this.isPlaying = false;
    clearTimeout(this.nextTimeout);
  }

  private toggleOutput() {
    this.isShowingOutput = !this.isShowingOutput;
    ipcRenderer.send('toggle-output-panel', this.isShowingOutput);
  }

  private isHovered(value: number) {
    return this.hoveredValue === String(value);
  }

  private hoverTick(playbarOffsetPercent: number) {
    this.hoveredValue = String(playbarOffsetPercent);

    const sliderRef = this.$refs.slider as VueSlider;
    const containerRect = sliderRef.$refs.container.getBoundingClientRect().toJSON();

    containerRect.x += Math.floor((containerRect.width * Number(playbarOffsetPercent)) / 100);

    ipcRenderer.send('on-tick-hover', containerRect, playbarOffsetPercent);
  }

  private onHoverPlaybar(e: MouseEvent) {
    const sliderRef = this.$refs.slider as VueSlider;
    sliderRef.setScale();
    // @ts-ignore
    const pos = sliderRef.getPosByEvent(e);

    const playbarOffsetPercent = this.closestTick(pos);
    this.hoverTick(playbarOffsetPercent);
  }

  private onValueChange(value: number) {
    // this is called when someone clicks, so pause the playback
    this.pause();
    ipcRenderer.send('on-tick-drag', value);
  }

  private closestTick(pos: number) {
    let closest = this.ticks[0];
    if (pos > this.ticks[this.ticks.length - 1]) {
      return this.ticks[this.ticks.length - 1];
    }
    let closestOffset = 100;
    for (const tick of this.ticks) {
      const offset = Math.abs(tick - pos);
      if (offset < closestOffset) {
        closestOffset = offset;
        closest = tick;
      }
      if (offset > closestOffset) break;
    }
    return closest;
  }
}
</script>

<style lang="scss">
@import '../../assets/style/common-mixins';
@include baseStyle();

.FooterPage {
  background-color: var(--toolbarBackgroundColor);
  border-top: 1px solid var(--toolbarBorderBottomColor);
  box-shadow: 0 0 2px 0 rgba(0, 0, 0, 0.8);
  top: 2px;
  position: relative;
  box-sizing: border-box;
  height: var(--toolbarHeight);

  .Playbar {
    background-color: var(--toolbarBackgroundColor);
    margin: 0;
    padding: 3px 10px 7px;
    position: relative;
    box-sizing: border-box;
    z-index: 100;
    display: flex;
    align-items: center;
    flex-flow: row;
    height: 100%;
    color: rgba(0, 0, 0, 0.8);
    -webkit-app-region: no-drag;

    .start {
      border: 1px solid var(--toolbarBorderColor);
      border-radius: 4px;
      padding: 4px 10px;
      white-space: nowrap;
      cursor: pointer;

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

    .vue-slider {
      cursor: pointer;
    }

    .vue-slider-mark {
      &.error {
        .vue-slider-mark-step {
          background-color: #9a0000;
          margin-top: -150%;
          height: 400%;
          width: 4px;
        }
      }

      .vue-slider-mark-step {
        height: 300%;
        margin-top: -100%;
        width: 2px;
      }

      &.hovered {
        .vue-slider-mark-step {
          background-color: transparent;
          margin-top: -50%;
          margin-left: -50%;
          border: solid #3498db;
          opacity: 1;
          border-width: 0 3px 3px 0;
          display: inline-block;
          height: 100%;
          border-radius: 0;
          transform: rotate(-45deg);
          padding: 3px;
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
  .output {
    border: 1px solid var(--toolbarBorderColor);
    border-radius: 4px;
    padding: 4px 10px;
    white-space: nowrap;
    cursor: pointer;

    &.selected {
      background: rgba(0, 0, 0, 0.1);
      color: #3c3c3c;
    }

    .label {
      margin-right: 5px;
      vertical-align: top;
      font-size: 1.1em;
    }
  }
}
</style>
