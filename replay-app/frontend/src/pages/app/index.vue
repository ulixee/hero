<template lang="pug">
.AppPage.Page(:style="cssVars")
  TabBar
  AddressBar
  ReplayBar
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import TabBar from './components/TabBar.vue';
import AddressBar from './components/AddressBar.vue';
import ReplayBar from './components/ReplayBar.vue';
import NoCache from '~frontend/lib/NoCache';
import store from '~frontend/pages/app/store';

@Component({ components: { TabBar, AddressBar, ReplayBar } })
export default class AppPage extends Vue {
  private store = store;

  @NoCache
  private get cssVars() {
    return {
      '--toolbarBackgroundColor': store.theme.toolbarBackgroundColor,
      '--toolbarBorderBottomColor': store.theme.toolbarBottomLineBackgroundColor,
    };
  }
}
</script>

<style lang="scss">
@import '../../assets/style/common-mixins';
@include baseStyle();
.AppPage {
  display: flex;
  flex-flow: column;
  background-color: var(--toolbarBackgroundColor);
  border-bottom: 1px solid var(--toolbarBorderBottomColor);
}
</style>
