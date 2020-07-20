import { ipcRenderer } from "electron";
<template lang="pug">
  .SessionPagesMenu.Page(:style="cssVars")
    ul
      li.page(v-for="page of store.pages" :class="{active:page.isActive}" @click="navigateToScriptPage(page)") {{page.url}}
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'nuxt-class-component';
import store from '~frontend/stores/session-pages-menu';
import Icon from '~frontend/components/Icon.vue';
import NoCache from '~frontend/lib/NoCache';
import { ipcRenderer } from 'electron';

@Component({ components: { Icon } })
export default class SessionPagesMenu extends Vue {
  private store = store;

  private navigateToScriptPage(page) {
    ipcRenderer.send(`navigate-to-session-page`, { id: page.id, url: page.url });
    store.hide();
  }

  @NoCache
  private get cssVars() {
    const dialogLightForeground = store.theme.dialogLightForeground;
    return {
      '--dropdownBackgroundColor': store.theme.dropdownBackgroundColor,
      '--menuItemHoverBackgroundColor': dialogLightForeground
        ? 'rgba(255, 255, 255, 0.06)'
        : 'rgba(0, 0, 0, 0.03)',
    };
  }
}
</script>

<style lang="scss">
@import '../../assets/style/overlay-mixins';
@import '../../assets/style/resets';
@include overlayBaseStyle();

.SessionPagesMenu {
  @include overlayStyle();
  ul {
    list-style: none;
    padding-left: 10px;
  }
  li.page {
    cursor: pointer;
    &:hover {
      background-color: #eeeeee;
    }
    padding: 5px;
    &.active {
      font-weight: bold;
    }
  }
}
</style>
