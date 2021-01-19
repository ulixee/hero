#!/usr/bin/env node

import { replay } from './index';

replay({} as any).catch(console.error);
