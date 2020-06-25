import Vue from 'vue';

declare module '*.vue' {
  export default Vue;
}

declare module 'vue/types/options' {
  // tslint:disable-next-line:interface-name
  interface ComponentOptions<V extends Vue> {
    metaInfo?: any;
  }
}
