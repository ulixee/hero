"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
function main({ args, utils: { reorderNonConfigurableDescriptors, reorderDescriptor }, }) {
    for (const { propertyName, prevProperty, throughProperty, path } of args.itemsToReorder) {
        try {
            if (!path.includes('.prototype')) {
                reorderNonConfigurableDescriptors(path, propertyName, prevProperty, throughProperty);
                continue;
            }
            reorderDescriptor(path, propertyName, prevProperty, throughProperty);
        }
        catch (err) {
            let log = `ERROR adding order polyfill ${path}->${propertyName}`;
            if (err instanceof Error) {
                log += `\n${err.stack}`;
            }
            console.error(log);
        }
    }
}
