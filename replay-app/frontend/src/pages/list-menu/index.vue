<template lang="pug">
.ListMenu.Page(:style="cssVars")
  ul
    li(@click="goto(item)" v-for="item of items" :class="{active:item.isActive}")
      Icon(v-if="iconName" :src="icon" :size=18 iconStyle="transform: 'scale(-1,1)'")
      .text {{item.title}}
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { ipcRenderer } from 'electron';
import * as icons from '~frontend/constants/icons';
import Icon from '~frontend/components/Icon.vue';
import NoCache from '~frontend/lib/NoCache';
import { OverlayStore } from '~frontend/models/OverlayStore';

@Component({ components: { Icon } })
export default class ListMenu extends Vue {
  private store = new OverlayStore();
  private items: IListItem[] = [];

  private iconName: string;
  private clickEventName: string;

  @NoCache
  get icon() {
    return icons[this.iconName];
  }

  private goto(item) {
    ipcRenderer.send(this.clickEventName ?? `goto-menu-item`, item);
    this.store.hide();
  }

  @NoCache
  private get cssVars() {
    return this.store.cssVars;
  }

  async mounted() {
    ipcRenderer.on(
      'will-show',
      (e, items: IListItem[], iconName: string, clickEventName: string) => {
        console.log('Show List', items, iconName)
        this.items = items;
        this.iconName = iconName;
        this.clickEventName = clickEventName;
      },
    );
  }
}

interface IListItem {
  title: string;
  id: string;
  isActive: boolean;
}
</script>

<style lang="scss">
@import '../../assets/style/overlay-mixins';
@import '../../assets/style/resets';
@include overlayBaseStyle();

.ListMenu {
  @include overlayStyle();
  ul {
    @include reset-ul();
    padding-top: 5px;
    margin: 0;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;

    li {
      display: flex;
      box-sizing: border-box;
      padding-left: 10px;
      padding-right: 10px;
      align-items: center;
      margin: 0;
      flex: 1;
      border-bottom: 1px solid #eee;
      cursor: pointer;

      .text {
        cursor: pointer;
        padding: 5px 0;
        flex: 1;
        margin-left: 5px;
      }
      .Icon {
        cursor: pointer;
        margin-right: 5px;
      }
    }
  }
}
</style>
