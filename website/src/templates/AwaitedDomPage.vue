<template lang="pug">
CoreLayout.has-sidebar.AwaitedDomPage(:footer="false")
  .container.flex.flex-align-top
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
  import { Vue, Component, Watch } from 'vue-property-decorator';
  import GithubLogo from '~/assets/logos/github.svg';

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
  }
</script>

<style lang="scss">
  @import "../assets/style/reset";

  .AwaitedDomPage {
    .container-base {
      max-width: 880px;
      margin-left: 0;
      padding-left: 0;
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
