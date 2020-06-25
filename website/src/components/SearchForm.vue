<template>
  <form :id="id" class="header-search">
    <label>
      <input
          ref="input"
          :id="`${id}-input`"
          class="header-search__input"
          placeholder="Search documentation..."
          title="Search documentation"
          type="search"
          @focus="onFocus"
      />
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon feather feather-search"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
    </label>
  </form>
</template>

<script>
  export default {
    props: {
      id: { type: String, default: 'search' }
    },

    data () {
      return {
        isLoaded: false
      }
    },

    methods: {
      onFocus () {
        if (this.isLoaded) return;

        import('docsearch.js').then(({ default: docsearch }) => {
          docsearch({
            indexName: 'gridsome',
            inputSelector: `#${this.id}-input`,
            apiKey: 'a7400a3a94b256c5283cb05efb860fc1',
            debug: process.env.NODE_ENV === 'development'
          });

          this.isLoaded = true;

          this.$nextTick(() => this.$refs.input.focus());
        })
      }
    }
  }
</script>

<style lang="scss">
  @import '~docsearch.js/dist/cdn/docsearch.min.css';

  .header-search {
    display: block;
    margin-bottom: 0;
    font-size: 0.9rem;
    flex: 1;
    width: 100%;

    label {
      display: flex;
      align-items: center;
    }

    .search-icon {
      margin-left: -1.66rem;
      width: 1rem;
      pointer-events: none;
      opacity: .6;
    }

    @media screen and (max-width: 550px) {
      & { margin: 0 3px 0 -15px; }

      .algolia-autocomplete .ds-dropdown-menu {
        position: fixed!important;
        left:0!important;
        top: var(--header-height)!important;
        right:50px!important;
        &:before {
          display: none!important;
        }
      }
    }

    .algolia-autocomplete {
      width: 100%;
    }
  }

  .algolia-autocomplete .algolia-docsearch-suggestion--wrapper {
    padding-top: 0;
  }
</style>
