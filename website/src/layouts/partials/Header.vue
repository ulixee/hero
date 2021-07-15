<template lang="pug">
  header
    .header-inner.container.flex.gap-30
      Logo
      Nav.flex-fit
      SearchForm
      nav.header-actions.flex
        a(aria-label="Twitter" href="//twitter.com/Ulixee" rel="noopener noreferrer" target="_blank" title="Follow us on Twitter")
          twitter-logo
        a(aria-label="Discord" href="//discord.gg/ydycFGU" rel="noopener noreferrer" class="hide-for-small" target="_blank" title="Join our discord")
          discord-logo
        .has-dropdown
          a(aria-label="github" href="//github.com/ulixee/ulixee" rel="noopener noreferrer" target="_blank" title="Ulixee @ GitHub")
            github-logo(height="20px" width="20px")
            span.hide-for-small(style="margin-left:5px;") v{{ $static.metadata.browserVersion }}
          .dropdown
            a(href="//github.com/ulixee/ulixee" rel="noopener noreferrer" target="_blank")
              | Repository
            a(href="//github.com/ulixee/ulixee/issues" rel="noopener noreferrer" target="_blank")
              | Issues
            a(href="//github.com/ulixee/ulixee/projects/1" rel="noopener noreferrer" target="_blank")
              | Roadmap
</template>

<static-query>
  query {
    metadata {
      browserVersion
    }
  }
</static-query>

<script>
  import Logo from './Logo'
  import Nav from './Nav'
  import SearchForm from '@/components/SearchForm.vue'
  import GithubLogo from '@/assets/logos/github.svg'
  import TwitterLogo from '@/assets/logos/twitter.svg'
  import DiscordLogo from '@/assets/logos/discord.svg'

  export default {
    components: {
      Logo,
      GithubLogo,
      TwitterLogo,
      DiscordLogo,
      SearchForm,
      Nav,
    }
  }
</script>

<style lang="scss">
  header {
    z-index: 20;
    position: relative;
    top: 0;
    background-color: var(--bg-transparent);
    border-bottom: 1px solid var(--header-border-color);
    box-shadow: 0 1px 0 var(--header-shadow-color);
    flex-wrap: nowrap;
    position: sticky;
    transition: background-color .3s, border-color, .3s;

    .header-inner {
      padding: 0 var(--space);
      min-height: var(--header-height);
    }

    .dropdown {
      width: 200px;
    }

    @media screen and (min-width: 992px) and (max-resolution: 1) {
      backdrop-filter: blur(4px);
    }

    @media screen and (min-width: 992px) and (-webkit-max-device-pixel-ratio: 1) {
      backdrop-filter: blur(4px);
    }
  }
</style>
