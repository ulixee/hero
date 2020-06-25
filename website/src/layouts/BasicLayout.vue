<template lang="pug">
CoreLayout.BasicLayout
  .Content
    slot
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import Logo from '../assets/logo.svg';

@Component({
  components: {
    Logo,
  },
})
export default class BasicLayout extends Vue {}
</script>

<style lang="scss">
.BasicLayout {
  .topbar {
    margin: 10px 25px 5px;
  }
  .Content {
    margin: 0 25px 25px;
    padding: 35px;
    min-height: 500px;
  }
}
</style>
