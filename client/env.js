"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const envUtils_1 = require("@ulixee/commons/lib/envUtils");
const Path = require("path");
(0, envUtils_1.loadEnv)(Path.join(__dirname, '..', 'core'));
(0, envUtils_1.loadEnv)(Path.join(__dirname, '..', 'hero-core'));
const env = process.env;
if (env.ULX_DATA_DIR)
    env.ULX_DATA_DIR = (0, envUtils_1.parseEnvPath)(env.ULX_DATA_DIR);
//# sourceMappingURL=env.js.map