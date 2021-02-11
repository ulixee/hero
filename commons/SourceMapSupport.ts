import * as SourceMapSupport from 'source-map-support';

if (!Error[Symbol.for('source-map-support')]) {
  Error[Symbol.for('source-map-support')] = true;
  SourceMapSupport.install({ uncaughtShimInstalled: false });
}
