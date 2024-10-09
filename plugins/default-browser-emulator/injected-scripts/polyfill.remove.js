"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typedArgs = args;
for (const itemToRemove of typedArgs.itemsToRemove) {
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
