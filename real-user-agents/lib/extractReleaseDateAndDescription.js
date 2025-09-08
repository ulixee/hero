"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = extractReleaseDateAndDescription;
function extractReleaseDateAndDescription(id, name, descriptions, releaseDates) {
    const slug = name
        .trim()
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/\W/g, m => (/[À-ž]/.test(m) ? m : '-'))
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
    const description = descriptions[id] ?? descriptions[slug];
    if (!description)
        throw new Error(`Missing description for ${id}`);
    const releaseDate = releaseDates[id] ?? releaseDates[slug] ?? releaseDates[`${id}-0`];
    if (!releaseDate)
        throw new Error(`Missing releaseDate for ${id}`);
    return [releaseDate, description];
}
//# sourceMappingURL=extractReleaseDateAndDescription.js.map