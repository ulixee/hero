<template lang="pug">
.Logo(@contextmenu="rightClick" oncontextmenu="return false;")
  g-link.logo__link(to="/" title="Back to home")
    Logo.logo__svg(alt="Home")
    span.logo__name Ulixee
</template>

<script>
  import Logo from '~/assets/logo.svg'
  export default {
    components: {
      Logo,
    },
    methods: {
      rightClick() {
        this.$router.push({ path: '/assets' });
        return false
      }
    }
  }
</script>

<style lang="scss">
.Logo {
  a {
    text-decoration: none;
    color: currentColor;
    white-space: nowrap;
    &:hover {
      color: var(--primary-color);
      .logo__svg path {
        fill: var(--primary-color);
      }
    }
  }
  .logo__svg {
    max-width: 25px;
    height: auto;
    margin-top: -3px;
    path {
      fill: currentColor;
    }
  }

  .logo__name {
    opacity: 0.85;
    margin-left: 10px;
    margin-right: 30px;
    font-weight: 900;
    line-height: 25px;
  }
}
</style>
