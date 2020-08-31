import 'prismjs/themes/prism.css';
import '~/assets/style/index.scss';

import CoreLayout from './layouts/CoreLayout.vue';
import BasicLayout from './layouts/BasicLayout.vue';

import Section from '~/components/Section.vue';
import Feature from '~/components/Feature.vue';
import Card from '~/components/Card';

import Typography from 'typography';
import Prism from 'vue-prismjs';

const typography = new Typography({
  baseFontSize: '16.5px',
  baseLineHeight: 1.6,
  scaleRatio: 1.9,
  headerFontFamily: [
    'Jost',
    'Helvetica',
    'Helvetica Neue',
    'Segoe UI',
    'Helvetica',
    'Arial',
    'sans-serif',
  ],
  bodyFontFamily: [
    'Jost',
    'Helvetica',
    'Helvetica Neue',
    'Segoe UI',
    'Helvetica',
    'Arial',
    'sans-serif',
  ],
});

export default function(Vue, { head, router }) {
  Vue.component('CoreLayout', CoreLayout);
  Vue.component('BasicLayout', BasicLayout);
  Vue.component('Section', Section);
  Vue.component('Feature', Feature);
  Vue.component('Card', Card);
  Vue.component('Prism', Prism);

  head.style.push({
    type: 'text/css',
    cssText: typography.toString(),
  });

  router.options.scrollBehavior = (to, from, savedPosition) => {
    if (savedPosition) {
      return savedPosition;
    }
    if (to.hash) {
      const navHeight = document.querySelector('nav').offsetHeight;
      const docRect = document.documentElement.getBoundingClientRect();
      const elemRect = document.querySelector(to.hash).getBoundingClientRect();

      return {
        x: elemRect.left - docRect.left,
        y: elemRect.top - docRect.top - navHeight,
      };
    }
    return { x: 0, y: -50 };
  };
}
