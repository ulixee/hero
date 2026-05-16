"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSemverSatisfied = isSemverSatisfied;
exports.nextVersion = nextVersion;
const semver = require("semver");
function isSemverSatisfied(version, isSatisfiedByVersion) {
    return semver.satisfies(isSatisfiedByVersion, `~${version}`, { includePrerelease: true });
}
function nextVersion(version) {
    return semver.inc(version, 'patch');
}
//# sourceMappingURL=VersionUtils.js.map