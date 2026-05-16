"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultCommandMarker = void 0;
class DefaultCommandMarker {
    get lastId() {
        return this.commandMarkerId;
    }
    get last() {
        return this.markers[this.markers.length - 1];
    }
    constructor(browserContext) {
        this.browserContext = browserContext;
        this.markers = [];
        this.commandMarkerId = 0;
        this.waitForLocationStartingMark = 0;
        this.logger = browserContext.logger.createChild(module);
    }
    incrementMark(action) {
        this.commandMarkerId += 1;
        // handle cases like waitForLocation two times in a row
        if (!action.startsWith('waitFor') || action === 'waitForLocation') {
            if (this.last?.action.startsWith('waitFor')) {
                this.waitForLocationStartingMark = this.commandMarkerId;
            }
        }
        if (action === 'goto') {
            this.waitForLocationStartingMark = this.commandMarkerId;
        }
        this.markers.push({ action, id: this.commandMarkerId });
    }
    getStartingCommandIdFor(marker) {
        if (marker === 'waitForLocation') {
            this.logger.info(`Starting Mark for ${marker}`, {
                startingMark: this.waitForLocationStartingMark,
                markers: this.markers,
            });
            return this.waitForLocationStartingMark;
        }
        return 0;
    }
}
exports.DefaultCommandMarker = DefaultCommandMarker;
//# sourceMappingURL=DefaultCommandMarker.js.map