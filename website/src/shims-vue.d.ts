import Vue from 'vue';

declare module '*.vue' {
  export default Vue;
}

declare module 'vue/types/options' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ComponentOptions<V extends Vue> {
    metaInfo?: any;
  }
}
