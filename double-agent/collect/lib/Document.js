"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const clickElementId = 'next-page';
const clickElementSelector = `#${clickElementId}`;
const waitForElementClass = 'ready';
const waitForElementSelector = `body.${waitForElementClass}`;
class Document {
    constructor(ctx) {
        this.headTags = [];
        this.bodyTags = [];
        this.footerTags = [];
        this.clickToNextPage = false;
        this.ctx = ctx;
    }
    get html() {
        return this.generateHtml();
    }
    injectBodyTag(tag) {
        this.bodyTags.push(tag);
    }
    injectHeadTag(tag) {
        this.headTags.push(tag);
    }
    injectFooterTag(tag) {
        this.footerTags.push(tag);
    }
    addNextPageClick() {
        this.clickToNextPage = true;
    }
    get clickElementId() {
        return clickElementId;
    }
    send() {
        this.ctx.res.writeHead(200, {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: 0,
            'Content-Type': 'text/html',
        });
        this.ctx.res.end(this.html);
    }
    redirectTo(location, domainType) {
        this.ctx.res.writeHead(302, {
            location: `${this.ctx.buildUrl(location, domainType)}`,
        });
        this.ctx.res.end();
    }
    // PRIVATE
    generateHtml() {
        const headTags = this.headTags;
        const bodyTags = this.bodyTags;
        const footerTags = this.footerTags;
        const nextPageLink = this.ctx.nextPageLink;
        const clickToNextPage = this.clickToNextPage;
        let nextPageTag;
        let finalPageTag;
        if (nextPageLink && clickToNextPage) {
            nextPageTag = `<a href="${nextPageLink}" id="${clickElementId}">Next</a>`;
        }
        else if (nextPageLink) {
            nextPageTag = `Go to ${nextPageLink}`;
        }
        if (!nextPageLink) {
            finalPageTag = `<div>Plugin Complete</div>`;
        }
        return `
<html>
<head>
    <title>DoubleAgent - Session #${this.ctx.session.id}</title>
    <meta content="text/html;charset=utf-8" http-equiv="Content-Type">
    <meta content="utf-8" http-equiv="encoding">
    <script>
      window.pageQueue = [];
    </script>
    <style>
      .display-inline-when-done { display: none; }
      .display-block-when-done { display: none; }
    </style>
    ${headTags.join('\n')}
</head>
<body>
<div>
  Loading... <span class="display-inline-when-done" style="display: none;">DONE!</span>
</div>
<div class="display-block-when-done">
  ${nextPageTag || ''}
  ${finalPageTag || ''}
</div>

${bodyTags.join('\n')}

<script type="text/javascript">
  Promise.all(window.pageQueue)
    .then(() => {
      document.querySelectorAll('.display-inline-when-done').forEach(elem => {
        elem.style.display = 'inline';
      });
      document.querySelectorAll('.display-block-when-done').forEach(elem => {
        elem.style.display = 'block';
      });
      document.body.classList.add('${waitForElementClass}');
      
      window.afterReady ? window.afterReady() : null
    }).catch(err => {
      console.log(err.stack);
    });
</script>

${footerTags.join('\n')}

</body>
</html>`.trim();
    }
}
Document.clickElementSelector = clickElementSelector;
Document.waitForElementSelector = waitForElementSelector;
exports.default = Document;
//# sourceMappingURL=Document.js.map