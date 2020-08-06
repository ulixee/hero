<template lang="pug">
.HomeScreen.Screen
  .content
    img(src="../../assets/logo.svg")
    h1 SecretAgent Replay
    button(@click="openFile") Open Script
</template>

<script lang="ts">
  import Vue from 'vue';
  import Component from 'vue-class-component';
  import { ipcRenderer } from 'electron';

  @Component({ components: { } })
  export default class HomeScreen extends Vue {
    private openFile(e: any) {
      e.target.blur();
      ipcRenderer.send('open-file');
    }
  }
</script>

<style lang="scss">
body {
  margin: 0;
  padding: 0;
}
.HomeScreen {
  display: flex;
  height: 100vh;
  justify-content: center;
  text-align: center;
  align-items: center;
  width: 100%;
  img {
    width: 100px;
  }
  button {
    padding: 10px 40px;
    font-size: 18px;
    border: 1px solid rgba(0,0,0,0.1);
    border-radius: 5px;
    width: 100%;
    box-sizing: border-box;
    cursor: pointer;
  }
}
</style>
