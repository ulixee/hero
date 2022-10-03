import ChromeEngine from '@unblocked-web/agent/lib/ChromeEngine';

// eslint-disable-next-line import/no-dynamic-require
const ChromeApp = require(ChromeEngine.defaultPackageName);

export const defaultBrowserEngine = new ChromeEngine(new ChromeApp());
