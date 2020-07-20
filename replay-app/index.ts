import 'source-map-support/register';
import { app } from 'electron';
import { platform } from 'os';
import log from 'electron-log';

// SETUP LOGGING //////////////////////////////////////////////////////////////////////////////////

console.log = log.log;
console.log(`Logging to ${log.transports.file.getFile().path}`);

//////////////////////////////////////////////////////////////////////////////////////////////////

import Application from './backend/Application';

(process.env as any).ELECTRON_DISABLE_SECURITY_WARNINGS = true;

app.name = 'SecretAgent';
app.allowRendererProcessReuse = true;
app.commandLine.appendSwitch('--enable-transparent-visuals');

process.on('uncaughtException', error => {
  console.error(error);
});

app.on('window-all-closed', () => {
  if (platform() !== 'darwin') {
    app.quit();
  }
});

Application.instance.start().catch(error => console.log('Error starting Application: ', error));
