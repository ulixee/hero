<template>
  <Layout>
    <Section container="sm" class="text-center">
      <h1>Logo & assets</h1>

      <p>Right click to download SVG</p>

      <div class="logo-container">
        <a href="/logos/logo-normal.svg" target="_blank">
          <img src="/logos/logo-normal.svg" />
        </a>
      </div>

      <div class="logo-container logo-container--dark">
        <a href="/logos/logo-normal-dark.svg" target="_blank">
          <img src="/logos/logo-normal-dark.svg" />
        </a>
      </div>

      <div class="logo-container logo-container--secondary">
        <a href="/logos/logo-dark.svg" target="_blank">
          <img src="/logos/logo-dark.svg" />
        </a>
      </div>

      <h2>Only Symbol</h2>
      <div class="grid-cols grid-cols--2 mb">
        <div class="logo-container">
          <a href="/logos/only-logo.svg" target="_blank">
            <img src="/logos/only-logo.svg" />
          </a>
        </div>
        <div class="logo-container logo-container--secondary">
          <a href="/logos/only-logo-light.svg" target="_blank">
            <img src="/logos/only-logo-light.svg" />
          </a>
        </div>
      </div>

      <h2>Symbol with circle background</h2>

      <div class="grid-cols mb">
        <div class="logo-container">
          <a href="/logos/logo-circle-normal.svg" target="_blank">
            <img src="/logos/logo-circle-normal.svg" />
          </a>
        </div>
        <div class="logo-container">
          <a href="/logos/logo-circle-dark.svg" target="_blank">
            <img src="/logos/logo-circle-dark.svg" />
          </a>
        </div>

        <div class="logo-container">
          <a href="/logos/logo-circle-light.svg" target="_blank">
            <img src="/logos/logo-circle-light.svg" />
          </a>
        </div>
      </div>

      <h2>Colors</h2>

      <div class="colors mb">

        <div class="colors__primary">
          <span>#00A672</span>
        </div>

        <div class="colors__secondary">
          <span>#00835C</span>
        </div>

        <div class="colors__dark">
          <span>#0d2538</span>
        </div>

      </div>

    </Section>
  </Layout>
</template>

<style lang="scss">
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
      color:#FFF;
      outline: 1px solid rgba(0,0,0,.1);
    }


    &__primary {
      background-color: var(--primary-color);
    }

    &__secondary {
      background-color: var(--primary-color-dark);
    }

    &__dark {
      background-color: var(--dark-bg);
    }


  }

</style>
