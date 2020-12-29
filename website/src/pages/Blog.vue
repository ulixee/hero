<template lang="pug">
    CoreLayout.Blog(:footer="false")
        Section.blog-index.flex-fit(container="base")
            article(v-for="post in $page.posts.edges" :key="post.id")
                h3 {{post.node.title}}
                time(:datetime="post.node.date") {{ post.node.date }}
                .summary {{ post.node.summary }}
                g-link(:to="post.node.path" rel="bookmark" class="read-link") read the article

            Pager( :info="$page.posts.pageInfo")
</template>

<page-query>
query Posts ($page: Int) {
    posts: allPost (sortBy: "date", order: DESC, perPage: 5, page: $page) @paginate {
        totalCount
        pageInfo {
            totalPages
            currentPage
        }
        edges {
            node {
                id
                title
                date (format: "MMMM D, Y")
                summary
                path
            }
        }
    }
}
</page-query>

<script>
import { Pager } from 'gridsome';
export default {
  components: {
    Pager,
  },
  metaInfo: {
    title: 'SecretAgent Blog Posts',
  },
};
</script>

<style lang="scss">
@import '../assets/style/reset';

.Blog {
  h3 {
    margin-bottom: 5px;
  }
  time {
    font-size: 0.9em;
    margin-top: 0;
    margin-bottom: 20px;
  }
  .summary {
    margin-top: 10px;
    border-bottom: 1px solid #e2ecec;
    margin-bottom: 10px;
    padding-bottom: 10px;
  }
  .read-link {
  }
}
</style>
