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
