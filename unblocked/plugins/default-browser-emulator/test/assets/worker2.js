
onconnect = e => {
  const port = e.ports[0];
  
  const { hardwareConcurrency, userAgent, deviceMemory } = navigator
  port.postMessage({ hardwareConcurrency, userAgent, deviceMemory });
  
  port.close();
};
