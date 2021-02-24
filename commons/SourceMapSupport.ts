import { install } from 'source-map-support';

if (!Error[Symbol.for('source-map-support')]) {
  Error[Symbol.for('source-map-support')] = true;
  install({ handleUncaughtExceptions: false });
}
