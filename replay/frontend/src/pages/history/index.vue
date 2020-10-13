<template lang="pug">
.HistoryPage
  ul.items-by-day(v-for="category of categories")
    li.category
      .category-title {{category.title}}
      .history-item(v-for="item of category.items")
        .item(@click="navigateToHistory($event, item)" :selected="item.selected")
          .title {{item.scriptEntrypoint}}
          .time {{formatTime(item.lastAccessedAt)}}
          Icon.remove(:src="ICON_CLOSE" @click="onRemoveClick($event, category, item)")
</template>

<script lang="ts">
import { ipcRenderer } from "electron";
import moment from "moment";
import Vue from "vue";
import Component from "vue-class-component";
import Icon from "~frontend/components/Icon.vue";
import { ICON_CLOSE } from "~frontend/constants";

interface IItem {
    id: string;
    sessionName: string,
    dataLocation: string,
    scriptInstanceId: string,
    scriptEntrypoint: string,
    lastAccessedAt: string;
  }

  interface ICategory {
    title: string;
    items: IItem[];
  }

  @Component({ components: { Icon } })
  export default class HistoryPage extends Vue {
    private ICON_CLOSE = ICON_CLOSE;
    private categories: ICategory[] = [];

    private navigateToHistory(e: any, item: IItem) {
      ipcRenderer.send(`navigate-to-history`, item);
    }

    private onRemoveClick(e: any, category: ICategory, item: IItem) {
      e.stopPropagation();
      // this.items = this.items.filter(x => x._id !== item._id);
      // ipcRenderer.send(`history-remove`, [item.id]);
    };

    private formatTime(str: string) {
      return moment(str).format('H:mma')
    }

    private async loadItems() {
      const items = await ipcRenderer.invoke(`fetch-history`);
      const itemsByTitle: { [key: string]: IItem[] } = {};
      for (let item of items) {
        item = { ...item };
        const title = this.createTitle(item);
        itemsByTitle[title] = itemsByTitle[title] || [];
        itemsByTitle[title].push(item);
      }
      for (const title of Object.keys(itemsByTitle)) {
        this.categories.push({ title, items: itemsByTitle[title] });
      }
    }

    private createTitle(item: IItem) {
      const lastAccessedAt = moment(item.lastAccessedAt)
      const formattedDate = lastAccessedAt.format('dddd, MMMM D, YYYY');
      const daysFrom = moment().diff(lastAccessedAt, 'days');
      if (daysFrom === 0) {
        return `Today - ${formattedDate}`;
      } else if (daysFrom === 1) {
        return `Yesterday - ${formattedDate}`;
      } else {
        return formattedDate;
      }

    }

    async mounted() {
      await this.loadItems();
    }
  }
</script>
