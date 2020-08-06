const path = require('path');

module.exports = {
  configureWebpack: {
    resolve: {
      alias: {
        '~frontend': path.resolve(__dirname),
        '~shared': path.resolve(__dirname, '..', 'shared'),
      },
    },
    target: 'electron-renderer',
  },
  publicPath: '/',
  outputDir: '../../build/replay-app/pages',
  pages: {
    app: {
      entry: './pages/app/index.ts',
      template: './public/index.html',
      filename: 'app.html',
    },
    'command-overlay': './pages/command-overlay/index.ts',
    history: './pages/history/index.ts',
    home: './pages/home/index.ts',
    'message-overlay': './pages/message-overlay/index.ts',
    'script-instances-menu': './pages/script-instances-menu/index.ts',
    'sessions-menu': './pages/sessions-menu/index.ts',
    'session-pages-menu': './pages/session-pages-menu/index.ts',
    'locations-menu': './pages/locations-menu/index.ts',
    'main-menu': './pages/main-menu/index.ts',
    settings: './pages/settings/index.ts',
  },
};
