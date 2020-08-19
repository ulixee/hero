<template lang="pug">
  .SessionsMenu.Page(:style="cssVars")
    ul
      li(v-for="(session, index) of store.sessions") {{index + 1}} of {{sessions.length}}
</template>

<script lang="ts">
  import Vue from 'vue';
  import Component from 'vue-class-component';
  import store from '~frontend/stores/script-instances-menu';
  import Icon from '~frontend/components/Icon.vue';
  import NoCache from '~frontend/lib/NoCache';

  @Component({ components: { Icon } })
  export default class SessionsMenu extends Vue {

    private store = store;

    @NoCache
    private get cssVars() {
      const dialogLightForeground = store.theme.dialogLightForeground;
      return {
        '--dropdownBackgroundColor': store.theme.dropdownBackgroundColor,
        '--menuItemHoverBackgroundColor': dialogLightForeground
          ? 'rgba(255, 255, 255, 0.06)'
          : 'rgba(0, 0, 0, 0.03)',
      }
    }
  }
</script>

<style lang="scss">
  @import "../../assets/style/overlay-mixins";
  @import "../../assets/style/resets";
  @include overlayBaseStyle();

  .SessionsMenu {
    @include overlayStyle();
    li {
      cursor: pointer;
    }
  }
</style>
