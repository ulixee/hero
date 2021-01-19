#!/usr/bin/env node

import { openReplayApp } from './index';

openReplayApp('--sa-show-dashboard', `--sa-default-node-path="${process.execPath}"`).catch(
  console.error,
);
