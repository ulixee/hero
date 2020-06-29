<template lang="pug">
CoreLayout.AssetsPage
  Section(container="sm" class="text-center")
    h1 Logo & assets
    p Right click to download SVG

    .logo-container
      a(href="/logos/logo-normal.svg" target="_blank")
        img(src="/logos/logo-normal.svg")

    .logo-container.logo-container--dark
      a(href="/logos/logo-dark.svg" target="_blank")
        img(src="/logos/logo-dark.svg")

    .logo-container.logo-container--secondary
      a(href="/logos/logo-dark.svg" target="_blank")
        img(src="/logos/logo-dark.svg")

    h2 Only Symbol

    .grid-cols.grid-cols--2.mb
      .logo-container
        a(href="/logos/only-logo-normal.svg" target="_blank")
          img(src="/logos/only-logo-normal.svg")
      .logo-container.logo-container--secondary
        a(href="/logos/only-logo-dark.svg" target="_blank")
          img(src="/logos/only-logo-dark.svg")

    h2 Colors

    .colors.mb
      .colors__primary
        span #F73065
      .colors__secondary
        span #463A3A
      .colors__dark
        span #0D2538
</template>

<style lang="scss">
.AssetsPage {
  h2 {
    margin-top: 70px;
    margin-bottom: 40px;
  }

  .logo-container {
    text-align: center;
    margin-bottom: var(--space);

    &--dark {
      background-color: var(--dark-bg);
    }

    &--secondary {
      background-color: var(--primary-color-dark);
    }

    a {
      display: block;
      padding: 10%;
    }

    img {
      max-width: 320px;
      width: 100%;
      margin: 0 auto;
    }
  }

  .colors {
    text-align: center;

    div {
      padding: 15% 5% 5px;
      display: inline-block;
      margin: 0 .5rem;
      text-align: center;
      color: #FFF;
      outline: 1px solid rgba(0, 0, 0, .1);
    }

    &__primary {
      background-color: var(--primary-color);
    }

    &__secondary {
      background-color: #463A3A;
    }

    &__dark {
      background-color: var(--dark-bg);
    }
  }
}
</style>
