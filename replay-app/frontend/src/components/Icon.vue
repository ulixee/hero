<template lang="pug">
.Icon.Component(:style="cssVars" @click="onClick")
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { transparency } from '~frontend/constants/transparency';
import NoCache from '~frontend/lib/NoCache';
import { getTheme } from '~shared/utils/themes';
import settings from '~frontend/lib/settings';

const IconProps = Vue.extend({
  props: {
    size: { type: Number, default: 20 },
    src: String,
    opacity: { type: Number, default: transparency.icons.active },
    autoInvert: { type: Boolean, default: true },
    disabled: Boolean,
    iconStyle: null,
  },
});

@Component({})
export default class Icon extends IconProps {
  public get theme() {
    return getTheme(settings.theme);
  }
  public $emit: any;

  private onClick(e) {
    if (this.disabled) return;
    this.$emit('click', e);
  }

  @NoCache
  private get cssVars() {
    const toolbarLightForeground = this.theme.toolbarLightForeground;
    return {
      '--backgroundImage': `url(${this.src})`,
      '--buttonIconSize': `${this.size}px`,
      '--buttonIconOpacity': `${this.disabled ? 0.25 : this.opacity}`,
      '--buttonIconFilter': this.autoInvert && toolbarLightForeground ? 'invert(100%)' : 'none',
    };
  }
}
</script>

<style lang="scss">
.Icon {
  width: var(--buttonIconSize);
  height: var(--buttonIconSize);
  display: inline-block;
  will-change: background-image;
  transition: 0.15s background-image;
  backface-visibility: hidden;
  background-image: var(--backgroundImage);
  background-size: contain;
  background-repeat: no-repeat;
  opacity: var(--buttonIconOpacity);
  filter: var(--buttonIconFilter);
}
</style>
