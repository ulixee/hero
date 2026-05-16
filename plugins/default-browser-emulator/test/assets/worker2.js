const { hardwareConcurrency, userAgent, deviceMemory } = navigator;
onconnect = e => {
    const port = e.ports[0];
    port.postMessage({ hardwareConcurrency, userAgent, deviceMemory });
    port.close();
};
//# sourceMappingURL=worker2.js.map