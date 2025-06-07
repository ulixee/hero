"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
function main({ args, utils: { getObjectAtPath } }) {
    for (const itemToRemove of args.itemsToRemove) {
        try {
            const parent = getObjectAtPath(itemToRemove.path);
            delete parent[itemToRemove.propertyName];
        }
        catch (err) {
            let log = `ERROR deleting prop ${itemToRemove.path}.${itemToRemove.propertyName}`;
            if (err instanceof Error) {
                log += `\n${err.stack}`;
            }
            console.error(log);
        }
    }
}
