"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ICorePlugin_1 = require("@ulixee/hero-interfaces/ICorePlugin");
const IPluginTypes_1 = require("@ulixee/hero-interfaces/IPluginTypes");
let CorePlugin = class CorePlugin {
    constructor({ emulationProfile, corePlugins, logger, sessionSummary }) {
        this.id = this.constructor.id;
        this.browserEngine = emulationProfile.browserEngine;
        this.plugins = corePlugins;
        this.logger = logger;
        this.sessionSummary = sessionSummary ?? { id: undefined, options: {} };
    }
};
CorePlugin.type = IPluginTypes_1.PluginTypes.CorePlugin;
CorePlugin = __decorate([
    ICorePlugin_1.CorePluginClassDecorator
], CorePlugin);
exports.default = CorePlugin;
//# sourceMappingURL=CorePlugin.js.map