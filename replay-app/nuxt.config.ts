import * as Path from 'path';

export default function config({ usingBuild }: any = {}) {
  return {
    mode: 'spa',
    srcDir: usingBuild ? null : 'frontend',
    buildDir: usingBuild ? 'frontend' : '../build/replay-app/frontend',
    generate: { dir: '../build/replay-app/static' },
    css: ['frontend/assets/style/main.css'],
    loading: false,
    loadingIndicator: false,
    build: {
      loadingScreen: false,
      extend(c, { isClient }) {
        if (isClient) {
          c.target = 'electron-renderer';
        }
        c.resolve.alias['~frontend'] = Path.join(__dirname, 'frontend');
        c.resolve.alias['~backend'] = Path.join(__dirname, 'backend');
        c.resolve.alias['~shared'] = Path.join(__dirname, 'shared');
      },
    },
    buildModules: ['@nuxt/typescript-build'],
  };
}
