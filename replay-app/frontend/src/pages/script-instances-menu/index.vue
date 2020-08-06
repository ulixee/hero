<template lang="pug">
.ScriptInstanceMenu.Page(:style="cssVars")
  ul
    li(v-for="instance of store.instances" @click="navigateToHistory(instance)" :class="{active:instance.isActive}") {{instance.startDate}}
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { ipcRenderer } from 'electron';
import store from '@/stores/script-instances-menu';
import Icon from '@/components/Icon.vue';
import NoCache from '@/lib/NoCache';

@Component({ components: { Icon } })
export default class ScriptInstanceMenu extends Vue {
  private store = store;

  private navigateToHistory(item) {
    const { dataLocation, sessionName, scriptInstanceId } = item;
    ipcRenderer.send(`navigate-to-history`, { dataLocation, scriptInstanceId, sessionName }, true);
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

.ScriptInstanceMenu {
  @include overlayStyle();
  ul {
    list-style: none;
    padding-left: 10px;
  }
  li {
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
