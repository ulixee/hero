"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavigationLoader = void 0;
const Resolvable_1 = require("@ulixee/commons/lib/Resolvable");
class NavigationLoader {
    get isNavigationComplete() {
        return this.navigationResolver.isResolved;
    }
    constructor(id, logger) {
        this.id = id;
        this.lifecycle = {};
        this.navigationResolver = new Resolvable_1.default();
        this.logger = logger.createChild(module, {
            loaderId: this.id,
        });
    }
    setNavigationResult(result) {
        this.navigationResolver.resolve(result ?? null);
        if (result && typeof result === 'string') {
            this.url = result;
        }
    }
    clearStoppedLoading() {
        clearTimeout(this.afterStoppedLoadingTimeout);
    }
    onStoppedLoading() {
        clearTimeout(this.afterStoppedLoadingTimeout);
        this.afterStoppedLoadingTimeout = setTimeout(this.markLoaded.bind(this), 50).unref();
    }
    onLifecycleEvent(name) {
        if ((name === 'commit' || name === 'DOMContentLoaded' || name === 'load') &&
            !this.isNavigationComplete) {
            this.logger.info('Resolving loader on lifecycle', { lifecycleEvent: name });
            this.clearStoppedLoading();
            this.setNavigationResult();
        }
        this.lifecycle[name] ??= new Date();
    }
    markLoaded() {
        if (!this.lifecycle.load) {
            this.onLifecycleEvent('DOMContentLoaded');
            this.onLifecycleEvent('load');
        }
    }
    toJSON() {
        return {
            id: this.id,
            isNavigationComplete: this.isNavigationComplete,
            lifecycle: this.lifecycle,
            url: this.url,
        };
    }
}
exports.NavigationLoader = NavigationLoader;
//# sourceMappingURL=NavigationLoader.js.map