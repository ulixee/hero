"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = fontScript;
const testFonts_1 = require("./lib/testFonts");
function fontScript(ctx) {
    return `
<script type="text/javascript">
(function browserFontProbe() {
  // extracted from https://github.com/Valve/fingerprintjs2/
  // a font will be compared against all the three default fonts.
  // and if it doesn't match all 3 then that font is not available.
  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  const fontList = ${JSON.stringify(testFonts_1.default)};

  function createSpan(fontFamily) {
    const s = document.createElement('span');
    /*
     * We need this css as in some weird browser this
     * span elements shows up for a microSec which creates a
     * bad user experience
     */
    s.style.position = 'absolute';
    s.style.left = '-9999px';
    // we test using 72px font size, we may use any size. I guess larger the better.
    s.style.fontSize = '72px';
    s.style.fontFamily = fontFamily;

    // css font reset to reset external styles
    s.style.fontStyle = 'normal';
    s.style.fontWeight = 'normal';
    s.style.letterSpacing = 'normal';
    s.style.lineBreak = 'auto';
    s.style.lineHeight = 'normal';
    s.style.textTransform = 'none';
    s.style.textAlign = 'left';
    s.style.textDecoration = 'none';
    s.style.textShadow = 'none';
    s.style.whiteSpace = 'normal';
    s.style.wordBreak = 'normal';
    s.style.wordSpacing = 'normal';

    // we use m or w because these two characters take up the maximum width.
    // And we use a LLi so that the same matching fonts can get separated
    s.innerHTML = 'mmmmmmmmmmlli';
    return s;
  }

  const promise = new Promise(resolve => window.addEventListener('load', resolve))
    .then(() => new Promise((resolve, reject) => {
      try {
        const defaultWidth = {};
        const defaultHeight = {};

        (function getDefaultDimensions() {
          const baseFontsSpans = baseFonts.map(createSpan);

          const baseFontsDiv = document.createElement('div');
          baseFontsDiv.append(...baseFontsSpans);
          document.body.appendChild(baseFontsDiv);
          let i = 0;
          for (const baseFont of baseFonts) {
            const span = baseFontsSpans[i];
            defaultWidth[baseFont] = span.offsetWidth;
            defaultHeight[baseFont] = span.offsetHeight;
            i += 1;
          }
          document.body.removeChild(baseFontsDiv);
        })();

        const fontsDiv = document.createElement('div');
        const fontsSpans = {};
        for (const font of fontList) {
          fontsSpans[font] = baseFonts.map(baseFont =>
            fontsDiv.appendChild(createSpan("'" + font + "'," + baseFont)),
          );
        }
        document.body.appendChild(fontsDiv);

        // check available fonts
        const fonts = fontList.filter(font => {
          const fontSpans = fontsSpans[font];
          let i = 0;
          for (const baseFont of baseFonts) {
            const isAvailable =
              fontSpans[i].offsetWidth !== defaultWidth[baseFont] ||
              fontSpans[i].offsetHeight !== defaultHeight[baseFont];
            if (isAvailable) {
              return true;
            }
            i += 1;
          }
          return false;
        });
        document.body.removeChild(fontsDiv);

        return fetch("${ctx.buildUrl('/save')}", {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ fonts }),
        }).then(resolve).catch(reject);
      } catch(err){
        reject(err);
      }
    }));

  window.pageQueue.push(promise);
})();
</script>`;
}
//# sourceMappingURL=fontScript.js.map