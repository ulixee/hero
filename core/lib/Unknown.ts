// public async fetchResource(url: string, headers?: { [name: string]: string }) {
//   return await this.session.runCommand(async () => {
//     const promise = createPromise<Filemeta>(60e3, `Resource at ${url} was not loaded`);
//     const cb = (filemeta?: Filemeta) => {
//       if (!filemeta) return;
//       if (filemeta.request.url === url && filemeta.request.method === 'GET') {
//         promise.resolve(filemeta);
//         this.off('request-intercepted', cb);
//       }
//     };
//     this.on('request-intercepted', cb);
//
//     await this.puppPage.evaluate(
//       // tslint:disable-next-line:no-shadowed-variable
//       (url, headers) => {
//         const init = { method: 'GET', headers, credentials: 'include' };
//         if (!headers) delete init.headers;
//         // @ts-ignore
//         const request = new Request(url, init);
//         return fetch(request);
//       },
//       url,
//       headers,
//     );
//
//     const filemeta = await promise.promise;
//
//     const cookies = await this.puppPage.cookies(url);
//     const body = await this.getAsset(filemeta.filename);
//     const snapshot = this.assembleSnapshot(
//       { cookies, body: body.toString('utf8') },
//       {
//         method: ['fetchResource', url, headers],
//       },
//     );
//     snapshot.navigationUrl = filemeta.response.url;
//     return snapshot;
//   });
// }

//
// public async takeScreenshot() {
//   const screenshot = await this.puppPage.screenshot({ fullPage: true });
//   await this.session.runCommand(async () => await this.createSnapshot());
//   return screenshot;
// }

// public async selectAll() {
//   return await this.session.runCommand(async () => {
//     // NOTE: might need more advanced handling https://github.com/GoogleChrome/puppeteer/issues/1313#issuecomment-480052880
//     await this.puppPage.evaluate(() => document.execCommand('selectall', false, null));
//
//     return this.createSnapshot({
//       method: ['selectAll'],
//     });
//   });
// }

//
// private async getPageElement(selectorOrXPath) {
//   if (selectorOrXPath.startsWith('//')) {
//     const items = await this.puppPage.$x(selectorOrXPath);
//     items.slice(1).forEach(x => x.dispose());
//     if (items.length) return items[0];
//   } else {
//     return await this.puppPage.$(selectorOrXPath);
//   }
// }
