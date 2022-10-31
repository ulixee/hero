import * as Path from 'path';
import * as Os from 'os';

export default {
  dataDir:
    process.env.UBK_NETWORK_DIR ?? process.env.UBK_DATA_DIR ?? Path.join(Os.tmpdir(), '.ulixee'),
  isLogDebug: !!process.env.DEBUG?.match(/[,]?ubk[:,]?/),
  useLogColors: !JSON.parse(process.env.NODE_DISABLE_COLORS ?? '0'),
};
