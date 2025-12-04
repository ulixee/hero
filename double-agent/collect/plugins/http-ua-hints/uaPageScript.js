"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = uaPageScript;
function uaPageScript(ctx) {
    return `
<script type="text/javascript">
(function uaProbe() {
  const keys = [
    'architecture',
    'bitness',
    'uaFullVersion',
    'wow64',
    'model',
    'platformVersion',
    'fullVersionList',
  ];
  try {
    const promise = navigator.userAgentData.getHighEntropyValues(keys).then(values => 
      fetch('${ctx.buildUrl('/save')}', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(values),
      })
    );
    window.pageQueue.push(promise);
  } catch(err) {
    fetch('${ctx.buildUrl('/save')}', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'null',
    })
  }
})();
</script>`;
}
//# sourceMappingURL=uaPageScript.js.map