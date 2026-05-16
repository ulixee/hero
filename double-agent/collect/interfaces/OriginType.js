"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOriginType = getOriginType;
var OriginType;
(function (OriginType) {
    OriginType["None"] = "none";
    OriginType["SameOrigin"] = "same-origin";
    OriginType["SameSite"] = "same-site";
    OriginType["CrossSite"] = "cross-site";
})(OriginType || (OriginType = {}));
const values = Object.values(OriginType);
function getOriginType(type) {
    if (OriginType[type])
        return OriginType[type];
    if (values.includes(type))
        return type;
    return null;
}
exports.default = OriginType;
//# sourceMappingURL=OriginType.js.map