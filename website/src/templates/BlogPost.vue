<template lang="pug">
    CoreLayout.BlogPost(:footer="false")
        Section.blog-content.flex-fit(container="base")
            h1 {{ $page.record.title }}
            VueRemarkContent(class="post mb")
</template>

<page-query>
query Post ($path: String!) {
  record: post (path: $path) {
        title
        date (format: "MMMM D, Y")
        content
    }
}
</page-query>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({
  metaInfo() {
    // @ts-ignore
    const { title, headings } = this.$page.record;
    return {
      title: title || (headings.length ? headings[0].value : undefined),
    };
  },
})
export default class BlogPost extends Vue {
  public $page: any;
  public $route: any;

  private get currentPath() {
    return this.$route.matched[0].path;
  }
}
</script>

<style lang="scss">
@import '../assets/style/reset';

.BlogPost {
  img {
    width: 100%;
    margin: 0;
    box-shadow: 0 0 16px rgba(0, 0, 0, 0.12), 0 -4px 10px rgba(0, 0, 0, 0.16);
  }
}
</style>
