# [AwaitedDOM](../basic-client/awaited-dom) <span>/</span> CSSRule

<div class='overview'>The <strong><code>CSSRule</code></strong> interface represents a single CSS rule. There are several types of rules, listed in the <a href="#Type_constants">Type constants</a> section below.</div>

<div class='overview'>The <code>CSSRule</code> interface specifies the properties common to all rules, while properties unique to specific rule types are specified in the more specialized interfaces for those rules' respective types.</div>

<div class='overview'>References to a <code>CSSRule</code> may be obtained by looking at a <code>CSSStyleSheet</code>'s <code>cssRules</code> list.</div>

## Properties

### .cssText <div class="specs"><i>W3C</i></div> {#cssText}

Represents the textual representation of the rule, e.g. "<code>h1,h2 { font-size: 16pt }</code>" or "<code>@import 'url'</code>". To access or modify parts of the rule (e.g. the value of "font-size" in the example) use the properties on the&nbsp;<a href="#Type_constants">specialized interface for the rule's type</a>.

#### **Type**: `Promise<string>`

### .parentRule <div class="specs"><i>W3C</i></div> {#parentRule}

Returns the containing rule, otherwise <code>null</code>. E.g. if this rule is a style rule inside an <code>@media</code> block, the parent rule would be that <code>CSSMediaRule</code>.

#### **Type**: [`CSSRule`](./css-rule.md)

### .parentStyleSheet <div class="specs"><i>W3C</i></div> {#parentStyleSheet}

Returns the <code>CSSStyleSheet</code> object for the style sheet that contains this rule

#### **Type**: [`CSSStyleSheet`](./css-style-sheet.md)

### .type <div class="specs"><i>W3C</i></div> {#type}

One of the <a href="#Type_constants">Type constants</a> indicating the type of CSS rule.

#### **Type**: `Promise<number>`
