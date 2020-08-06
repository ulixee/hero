<template lang="pug">
.Preloader.Component(:indeterminate="indeterminate" :size="size")
  svg(viewBox="25 25 50 50")
    circle(cx="50" cy="50" r="20" fill="none" strokeMiterlimit="10")
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { BLUE_500 } from '@/constants';

const PreloaderProps = Vue.extend({
  props: {
    color: { type: String, default: BLUE_500 },
    thickness: { type: Number, default: 4 },
    size: { type: Number, default: 48 },
    indeterminate: Boolean,
    value: Number,
  }
});

@Component({})
export default class Preloader extends PreloaderProps {
  private get cssVars() {
    return {
      '--width': `${this.size}px`,
      '--height': `${this.size}px`,
      '--animation': this.indeterminate ? `preloader-rotate 2s linear infinite` : '',
      '--svgStrokeDasharray': this.indeterminate ? '1, 200' : `199, 200`,
      '--svgStrokeDashoffset': `${199 - this.value * (199 - 82)}px`,
      '--svgStrokeWidth': `${this.thickness}`,
      '--svgStrokeColor': this.color,
      '--svgAnimation': this.indeterminate ? `preloader-dash 1.5s ease-in-out infinite, color 6s ease-in-out infinite`: '',
      '--svgTransition': `0.3s stroke ${this.indeterminate ? ', 0.3s stroke-dasharray' : ''}`,
    };
  }
}
</script>

<style lang="scss">
.Preloader {
  transform-origin: center center;
  z-index: 5;
  transform: rotate(-89deg);
  width: var(--width);
  height: var(--height);
  animation: var(--animation);

  @keyframes preloader-rotate {
    100% {
      -webkit-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }
  @keyframes preloader-dash {
    0% {
      stroke-dasharray: 1, 200;
      stroke-dashoffset: 0;
    }
    50% {
      stroke-dasharray: 89, 200;
      stroke-dashoffset: -35px;
    }
    100% {
      stroke-dasharray: 89, 200;
      stroke-dashoffset: -124px;
    }
  }

  svg circle {
    stroke-linecap: square;
    stroke-dasharray: var(--svgStrokeDasharray);
    stroke-dashoffset: var(--svgStrokeDashoffset);
    stroke-width: var(--svgStrokeWidth);
    stroke: var(--svgStrokeColor);
    animation: var(--svgAnimation);
    transition: var(--svgTransition);
  }
}
</style>
