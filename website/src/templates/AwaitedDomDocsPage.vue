<template lang="pug">
CoreLayout.has-sidebar.AwaitedDomPage(:footer="false")
  .container.flex.flex-align-top
    .sidebar
      template(v-if="links" v-for="(group, i1) in links")
        h3.menu-item(:key="`title-${i1}`") {{ group.title }}
        template(v-for="(item, i2) in group.items")
          template(v-if="item.items")
            h4.menu-item(:key="`title-${i1}-${i2}`") {{item.title}}
            template(v-for="(itm, i3) in item.items")
              g-link.menu-item.menu-link(:exact="itm.link == '/docs/'" :to="itm.link" :key="`link-${i1}-${i2}-${i3}`")
                | {{ itm.title }}
          template(v-else)
            g-link.menu-item.menu-link(:exact="item.link == '/docs/'" :to="item.link" :key="`link-${i1}-${i2}`")
              | {{ item.title }}

    Section.doc-content.flex-fit(container="base")
      VueRemarkContent(class="post mb")
      p
        a.github-edit-link(:href="editLink" target="_blank")
          GithubLogo
          span Edit this page on GitHub

    .sidebar.sidebar--right.hide-for-small
      template(v-if="subtitles.length > 0 && subtitles[0].depth !== 3")
        h3 On this page
        ul.menu-item.submenu(v-if="subtitles.length")
          li.submenu__item(:class="'submenu__item-depth-' + subtitle.depth" v-for="subtitle in subtitles" :key="subtitle.value")
            a.submenu__link(:href="subtitle.anchor") {{ subtitle.value }}
</template>

<page-query>
  query ($id: ID!) {
    record: awaitedDom (id: $id) {
      title
      headings (depth: h1) {
        value
      }
      subtitles: headings {
        depth
        value
        anchor
      }
    }
  }
</page-query>

<script lang="ts">
  import { Vue, Component } from 'vue-property-decorator';
  import GithubLogo from '~/assets/logos/github.svg';
  import generateLinks from "../lib/generateLinks";

  const links = generateLinks();

  @Component({
    metaInfo() {
      // @ts-ignore
      const { title, headings } = this.$page.record;
      return {
        title: title || (headings.length ? headings[0].value : undefined),
      };
    },
    components: {
      GithubLogo
    },
  })
  export default class AwaitedDomPage extends Vue {
    public $page: any;
    public $route: any;
    public links: any[] = links;

    private get subtitles() {
      // Remove h1, h4, h5, h6 titles
      let subtitles = this.$page.record.subtitles.filter(function(value: any, index: any, arr: any) {
        return [2, 3].includes(value.depth);
      });
      return subtitles;
    }

    private get currentPath() {
      return this.$route.matched[0].path;
    }

    private get editLink() {
      let path = this.currentPath;
      if ((path.match(new RegExp('/', 'g')) || []).length == 1) path = path + '/README';
      return `https://github.com/ulixee/secret-agent/blob/master/website${path}.md`;
    }

    private get items() {
      const items = [];
      for (const group of this.links) {
        items.push({ title: group.title, link: group.link });
        for (const item of group.items) {
          items.push({ title: item.title, link: item.link });
          if (item.items) items.push(...item.items);
        }
      }
      return items;
    }
  }
</script>

<style lang="scss">
  @import "../assets/style/reset";

  .AwaitedDomPage {
    h1 {
      a:nth-child(2) {
        &:before {
          display: none;
        }
        display: inline-block;
        float: none;
        width: auto;
        margin-left: 0;
        opacity: 1;
        font-size: 1em;
        text-decoration: none;
        top: 0;
        color: rgba(0,0,0,0.6);
        padding-right: 10px;
        &:hover {
          color: var(--primary-color-dark)
        }
      }
      span {
        opacity: 0.3;
        font-weight: 100;
      }
    }
    ul.methods, ul.properties {
      @include reset-ul();
      & > li {
        margin-bottom: 20px;
        & > a {
          font-weight: bold;
          background-color: rgba(220,220,220,.5);
          font-size: 1rem;
        }
        & > div {
          margin-left: 10px;
        }
      }
    }
  }
</style>
