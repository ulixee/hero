<template lang="pug">
BasicLayout.Home
  Section(container="md" dots="true")
    .post-header.container-md.mb-x2
      h1 The Web Browser  Built for Scraping
      p.
        SecretAgent is a headless browser that’s nearly impossible to detect. It achieves this by emulating real users.
        And it has powerful auto-replay functionality that lets you create and debug scripts in record setting time.
      a.button(href="/docs") Get Started

    .awards
      .box Ranked #1 Headless Browser by the Bot Blocking Analyzer (psst... we created it)
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

@Component({
  components: {},
})
export default class Home extends Vue {
  public mounted() {
    document.body.setAttribute('data-theme', 'dark');
  }

  public destroyed() {
    document.body.removeAttribute('data-theme');
  }
}
</script>

<style lang="scss">
.Home {
  text-align: center;
  h1 {
    font-size: 5.9rem;
  }
  p {
    padding: 0 25px;
    font-size: 1.3rem;
  }
  .el-row {
    height: 100vh;
  }
  .Content {
    min-height: calc(100vh - 129px);
  }

  a.button {
    margin-top: 50px;
    padding: 13px 70px;
    font-size: 1.4rem;
  }

  .awards {
    margin-top: 80px;
    .box {
      display: inline-block;
      padding: 7px 45px;
      background: rgba(0,0,0,0.1);
      border-radius: 5px;
      box-shadow: 1px 1px 0 rgba(255,255,255,0.1);
      border: 1px solid rgba(0, 0, 0, 0.2);
      color: rgba(255,255,255,0.5);
    }
  }
}
</style>
