#!/usr/bin/env node

import { openReplayApp } from './index';

openReplayApp('--show-dashboard', `--default-node-path="${process.execPath}"`).catch(console.error);
