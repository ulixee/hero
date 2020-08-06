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
  outputDir: '../../build/replay-app/frontend',
  pages: {
    app: './src/pages/app/index.ts',
    'command-overlay': './src/pages/command-overlay/index.ts',
    history: './src/pages/history/index.ts',
    home: './src/pages/home/index.ts',
    'message-overlay': './src/pages/message-overlay/index.ts',
    'script-instances-menu': './src/pages/script-instances-menu/index.ts',
    'sessions-menu': './src/pages/sessions-menu/index.ts',
    'session-pages-menu': './src/pages/session-pages-menu/index.ts',
    'locations-menu': './src/pages/locations-menu/index.ts',
    'main-menu': './src/pages/main-menu/index.ts',
    settings: './src/pages/settings/index.ts',
  },
};
