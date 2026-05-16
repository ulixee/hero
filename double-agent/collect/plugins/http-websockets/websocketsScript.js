"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = websocketsScript;
const DomainUtils_1 = require("@double-agent/collect/lib/DomainUtils");
function websocketsScript(ctx) {
    const isSecure = ctx.url.protocol === 'https:';
    return `
<script type="text/javascript">
  function ws(wsUrl) {
    return new Promise(resolve => {
      const ws = new WebSocket(wsUrl);
      ws.onerror = function(err) {
        console.log('WebSocket error', err);
        resolve();
      };
      ws.onopen = function() {
        const message = JSON.stringify({ host: location.host, sessionId: '${ctx.session.id}'});
        ws.send(message, {
          compress:true, binary:false, fin: false, mask: true
        }, function(){});
        resolve();
      };
      ws.onmessage = function(message) {
        console.log('Websocket message received %s from %s', message.data, message.origin)
      }
    });
  }
  window.pageQueue.push(
    ws('${ctx.buildUrl('/ws', DomainUtils_1.DomainType.MainDomain, isSecure ? 'wss' : 'ws')}'),
    ws('${ctx.buildUrl('/ws', DomainUtils_1.DomainType.SubDomain, isSecure ? 'wss' : 'ws')}'),
    ws('${ctx.buildUrl('/ws', DomainUtils_1.DomainType.CrossDomain, isSecure ? 'wss' : 'ws')}')
  );
</script>`;
}
//# sourceMappingURL=websocketsScript.js.map