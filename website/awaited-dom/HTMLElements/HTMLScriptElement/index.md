# HTMLScriptElement

<div class='overview'><span class="seoSummary">HTML <a href="/en-US/docs/Web/HTML/Element/script" title="The HTML <script> element is used to embed or reference executable code; this is typically used to embed or refer to JavaScript code."><code>&lt;script&gt;</code></a> elements expose the <strong><code>HTMLScriptElement</code></strong> interface, which provides special properties and methods for manipulating the behavior and execution of <code>&lt;script&gt;</code> elements (beyond the inherited <a href="/en-US/docs/Web/API/HTMLElement" title="The HTMLElement interface represents any HTML element. Some elements directly implement this interface, while others implement it via an interface that inherits it."><code>HTMLElement</code></a> interface).</span></div>

<div class='overview'>JavaScript files should be served with the <code>application/javascript</code> <a href="/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types">MIME type</a>, but browsers are lenient and block them only if the script is served with an image type (<code>image/*</code>), video type (<code>video/*</code>), audio type (<code>audio/*</code>), or <code>text/csv</code>. If the script is blocked, its element receives an <code><a href="/en-US/docs/Web/Events/error" title="/en-US/docs/Web/Events/error">error</a></code> event; otherwise, it receives a <code><a href="/en-US/docs/Web/Events/load" title="/en-US/docs/Web/Events/load">load</a></code> event.</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">async</a>
    <div><p>The <code>async</code> and <code>defer</code> attributes are <a href="/en-US/docs/JavaScript/Reference/Global_Objects/Boolean">boolean</a> attributes that control how the script should be executed. <strong>The <code>defer</code> and <code>async</code> attributes must not be specified if the <code>src</code> attribute is absent.</strong></p>
    <p>There are three possible execution modes:</p>
    <ol>
     <li>If the <code>async</code> attribute is present, then the script will be executed asynchronously as soon as it downloads.</li>
     <li>If the <code>async</code> attribute is absent but the <code>defer</code> attribute is present, then the script is executed when <a href="/en-US/docs/Web/Events/DOMContentLoaded">the page has finished parsing</a>.</li>
     <li>If neither attribute is present, then the script is fetched and executed immediately, blocking further parsing of the page.</li>
    </ol>
    <p>The <code>defer</code> attribute may be specified with the <code>async</code> attribute, so legacy browsers that only support <code>defer</code> (and not <code>async</code>) fall back to the <code>defer</code> behavior instead of the default blocking behavior.</p>
    <div class="note"><strong>Note:</strong> The exact processing details for these attributes are complex, involving many different aspects of HTML, and therefore are scattered throughout the specification. <a class="external" href="http://www.w3.org/html/wg/drafts/html/master/scripting-1.html#prepare-a-script" rel="noopener">These algorithms</a> describe the core ideas, but they rely on the parsing rules for <a href="/en-US/docs/Web/HTML/Element/script" title="The HTML <script> element is used to embed or reference executable code; this is typically used to embed or refer to JavaScript code."><code>&lt;script&gt;</code></a>&nbsp;<a class="external" href="http://www.w3.org/html/wg/drafts/html/master/syntax.html#scriptTag" rel="noopener">start</a> and <a class="external" href="http://www.w3.org/html/wg/drafts/html/master/syntax.html#scriptEndTag" rel="noopener">end</a> tags in HTML, <a class="external" href="http://www.w3.org/html/wg/drafts/html/master/syntax.html#scriptForeignEndTag" rel="noopener">in foreign content</a>, and <a class="external" href="http://www.w3.org/html/wg/drafts/html/master/the-xhtml-syntax.html#scriptTagXML" rel="noopener">in XML</a>; the rules for the <a href="/en-US/docs/DOM/document.write"><code>document.write()</code></a> method; the handling of <a class="external" href="http://www.w3.org/html/wg/drafts/html/master/webappapis.html#scripting" rel="noopener">scripting</a>; and so on.</div></div>
  </li>
  <li>
    <a href="">charset</a>
    <div>Represents the character encoding of an external script. It reflects the <code><a href="/en-US/docs/Web/HTML/Element/script#attr-charset">charset</a></code> attribute.</div>
  </li>
  <li>
    <a href="">crossOrigin</a>
    <div>A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> reflecting the <a href="/en-US/docs/Web/HTML/CORS_settings_attributes">CORS setting</a> for the script element. For scripts from other <a href="/en-US/docs/Glossary/Origin">origins</a>, this controls if error information will be exposed.</div>
  </li>
  <li>
    <a href="">defer</a>
    <div></div>
  </li>
  <li>
    <a href="">event</a>
    <div>An old, quirky way of registering event handlers on elements in an HTML document.</div>
  </li>
  <li>
    <a href="">noModule</a>
    <div>This Boolean property stops the script's execution in browsers that support<a class="external" href="https://hacks.mozilla.org/2015/08/es6-in-depth-modules/" rel="noopener"> ES2015 modules</a> — used to run fallback scripts in older browsers that do <em>not</em> support JavaScript modules.</div>
  </li>
  <li>
    <a href="">referrerPolicy</a>
    <div>A <a href="/en-US/docs/Web/API/DOMString" title="DOMString is a UTF-16 String. As JavaScript already uses such strings, DOMString is mapped directly to a String."><code>DOMString</code></a> that reflects the <code><a href="/en-US/docs/Web/HTML/Element/script#attr-referrerpolicy">referrerpolicy</a></code> HTML attribute indicating which referrer to use when fetching the script, and fetches done by that script.</div>
  </li>
  <li>
    <a href="">src</a>
    <div>Gets and sets the URL of an external script. It reflects the <code><a href="/en-US/docs/Web/HTML/Element/script#attr-src">src</a></code> attribute.</div>
  </li>
  <li>
    <a href="">text</a>
    <div><p>The IDL attribute <code>text</code> joins and returns the contents of all <a href="/en-US/docs/DOM/Text"><code>Text</code> nodes</a> inside the <a href="/en-US/docs/Web/HTML/Element/script" title="The HTML <script> element is used to embed or reference executable code; this is typically used to embed or refer to JavaScript code."><code>&lt;script&gt;</code></a> element (ignoring other nodes like comments) in tree order. On setting, it acts the same way as the <a href="/en-US/docs/DOM/Node.textContent"><code>textContent</code></a> IDL attribute.</p>
    <div class="note"><strong>Note:</strong> When inserted using the <a href="/en-US/docs/DOM/document.write"><code>document.write()</code></a> method, <a href="/en-US/docs/Web/HTML/Element/script" title="The HTML <script> element is used to embed or reference executable code; this is typically used to embed or refer to JavaScript code."><code>&lt;script&gt;</code></a> elements execute (typically synchronously), but when inserted using <a href="/en-US/docs/DOM/element.innerHTML"><code>innerHTML</code></a> or <a href="/en-US/docs/DOM/element.outerHTML"><code>outerHTML</code></a>, they do not execute at all.</div></div>
  </li>
  <li>
    <a href="">type</a>
    <div>Represents the MIME type of the script. It reflects the <code><a href="/en-US/docs/Web/HTML/Element/script#attr-type">type</a></code> attribute.</div>
  </li>
</ul>

## Methods

<ul class="items methods">

</ul>

## Events
