<template lang="pug">
.AppButton(
  @click="onClick"
  @contextmenu="onContextMenu"
  @mousedown="onMouseDown"
  @mouseup="onMouseUp"
  :id="id"
  :class="className"
  :style="cssVars"
  ref="button"
)
  .button-icon(:style="iconStyle")
  .button-badge(v-if="badge") {{ badgeText }}
  template(v-if="preloader && value > 0")
    .preloader-bg
    Preloader(:thickness="3" :size="36" :value="value")
  | {{ children }}
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'nuxt-class-component';
import { transparency } from '~frontend/constants/transparency';
import { BLUE_500 } from '~frontend/constants';
import Preloader from '~frontend/components/Preloader.vue';
import { TOOLBAR_BUTTON_WIDTH, TOOLBAR_BUTTON_HEIGHT } from '~shared/constants/design';
import store from '~frontend/stores/app';
import NoCache from '~frontend/lib/NoCache';

const AppButtonProps = Vue.extend({
  props: {
    size: { type: Number, default: 20 },
    icon: String,
    buttonRef: Function,
    disabled: Boolean,
    className: String,
    children: null,
    opacity: { type: Number, default: transparency.icons.active },
    autoInvert: { type: Boolean, default: true },
    badgeBackground: { type: String, default: BLUE_500 },
    badge: Boolean,
    badgeTextColor: { type: String, default: 'white' },
    badgeText: String,
    badgeTop: { type: Number, default: 4 },
    badgeRight: { type: Number, default: 4 },
    preloader: Boolean,
    value: Number,
    toggled: Boolean,
    iconStyle: null,
    id: String,
  },
});

@Component({ components: { Preloader } })
export default class AppButton extends AppButtonProps {
  private onClick(e: any) {
    this.$emit('click', e);
  }

  private onMouseDown(e: any) {
    this.$emit('mousedown', e);
  }

  private onMouseUp(e: any) {
    this.$emit('mouseup', e);
  }

  onContextMenu(e: any) {
    this.$emit('contextmenu', e);
  }

  mounted() {
    if (this.buttonRef) {
      this.buttonRef(this.$refs.button);
    }
  }

  @NoCache
  private get cssVars() {
    const toolbarLightForeground = store.theme.toolbarLightForeground;
    const toggledBgColor = toolbarLightForeground ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)';
    const hoverBgColor = toolbarLightForeground
      ? 'rgba(255, 255, 255, 0.08)'
      : 'rgba(0, 0, 0, 0.06)';
    return {
      '--height': `${TOOLBAR_BUTTON_HEIGHT}px`,
      '--minWidth': `${TOOLBAR_BUTTON_WIDTH}px`,
      '--pointerEvents': `${this.disabled ? 'none' : 'inherit'}`,
      '--appRegion': `${this.disabled ? 'drag' : 'no-drag'}`,
      '--backgroundColor': `${this.toggled ? toggledBgColor : 'none'}`,
      '--activeBackgroundColor': toggledBgColor,
      '--hoverBackgroundColor': this.toggled ? toggledBgColor : hoverBgColor,
      '--buttonIconSize': `${this.size}px`,
      '--buttonIconBackgroundSize': `${this.size}px ${this.size}px`,
      '--buttonIconOpacity': `${this.disabled ? 0.25 : this.opacity}`,
      '--buttonIconFilter': this.autoInvert && toolbarLightForeground ? 'invert(100%)' : 'none',
      '--buttonBackgroundImage': `url(${this.icon})`,
      '--buttonBadgeBackground': this.badgeBackground,
      '--buttonBadgeColor': this.badgeTextColor,
      '--buttonBadgeRight': `${this.badgeRight}px`,
      '--buttonBadgeTop': `${this.badgeTop}px`,
      '--preloaderBgBorderColor': toolbarLightForeground
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.06)',
    };
  }
}
</script>

<style lang="scss">
@import '../../../assets/style/common-mixins';

.AppButton {
  position: relative;
  transition: 0.2s background-color;
  backface-visibility: hidden;
  margin: 0 1px;
  border-radius: 4px;
  height: var(--height);
  min-width: var(--minWidth);
  pointer-events: var(--pointerEvents);
  -webkit-app-region: var(--appRegion);
  background-color: var(--backgroundColor);

  &:active {
    background-color: var(--activeBackgroundColor) !important;
  }

  &:hover {
    background-color: var(--hoverBackgroundColor);
  }

  .Preloader {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  .button-icon {
    width: 100%;
    height: 100%;
    will-change: background-image;
    transition: 0.15s background-image;
    backface-visibility: hidden;
    @include centerIcon();
    background-image: var(--buttonBackgroundImage);
    background-size: var(--buttonIconSize);
    opacity: var(--buttonIconOpacity);
    filter: var(--buttonIconFilter);
  }

  .button-badge {
    position: absolute;
    padding: 1px 3px;
    border-radius: 8px;
    min-height: 6px;
    pointer-events: none;
    z-index: 5;
    font-size: 8px;
    background-color: var(--buttonBadgeBackground);
    color: var(--buttonBadgeColor);
    right: var(--buttonBadgeRight);
    top: var(--buttonBadgeTop);
  }

  .preloader-bg {
    width: 32px;
    height: 32px;

    pointer-events: none;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 3px solid var(--preloaderBgBorderColor);
  }
}
</style>
