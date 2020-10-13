const path = require('path');

module.exports = {
  configureWebpack: {
    resolve: {
      alias: {
        '~frontend': path.resolve(__dirname, 'src'),
        '~shared': path.resolve(__dirname, '..', 'shared'),
      },
    },
    target: 'electron-renderer',
  },
  publicPath: '/',
  outputDir: '../../build/replay/frontend',
  pages: {
    header: './src/pages/header/index.ts',
    'command-overlay': './src/pages/command-overlay/index.ts',
    history: './src/pages/history/index.ts',
    dashboard: './src/pages/dashboard/index.ts',
    'list-menu': './src/pages/list-menu/index.ts',
    playbar: './src/pages/playbar/index.ts',
    'message-overlay': './src/pages/message-overlay/index.ts',
    'locations-menu': './src/pages/locations-menu/index.ts',
    'main-menu': './src/pages/main-menu/index.ts',
    settings: './src/pages/settings/index.ts',
  },
};
