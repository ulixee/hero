# [AwaitedDOM](/docs/basic-interfaces/awaited-dom) <span>/</span> CSSRule

<div class='overview'>The <strong><code>CSSRule</code></strong> interface represents a single CSS rule. There are several types of rules, listed in the <a href="#Type_constants">Type constants</a> section below.</div>

<div class='overview'>The <code>CSSRule</code> interface specifies the properties common to all rules, while properties unique to specific rule types are specified in the more specialized interfaces for those rules' respective types.</div>

<div class='overview'>References to a <code>CSSRule</code> may be obtained by looking at a <a href="/en-US/docs/Web/API/CSSStyleSheet" title="The CSSStyleSheet interface represents a single CSS stylesheet, and lets you inspect and modify the list of rules contained in the stylesheet."><code>CSSStyleSheet</code></a>'s <code>cssRules</code> list.</div>

## Properties

### .cssText <div class="specs"><i>W3C</i></div> {#cssText}

Represents the textual representation of the rule, e.g. "<code>h1,h2 { font-size: 16pt }</code>" or "<code>@import 'url'</code>". To access or modify parts of the rule (e.g. the value of "font-size" in the example) use the properties on the&nbsp;<a href="#Type_constants">specialized interface for the rule's type
</a>.

#### **Type**: `null`

### .parentRule <div class="specs"><i>W3C</i></div> {#parentRule}

Returns the containing rule, otherwise <code>null</code>. E.g. if this rule is a style rule inside an <a href="/en-US/docs/Web/CSS/@media" title="The @media CSS at-rule can be used to apply part of a style sheet based on the result of one or more media queries."><code>@media</code></a> block, the parent rule would be that <a href="/en-US/docs/Web/API/CSSMediaRule" title="The CSSMediaRule interface represents a single CSS @media rule. It implements the CSSConditionRule interface, and therefore the CSSGroupingRule and the CSSRule interface with a type value of 4 (CSSRule.MEDIA_RULE)."><code>CSSMediaRule</code>
</a>.

#### **Type**: `null`

### .parentStyleSheet <div class="specs"><i>W3C</i></div> {#parentStyleSheet}

Returns the <a href="/en-US/docs/Web/API/CSSStyleSheet" title="The CSSStyleSheet interface represents a single CSS stylesheet, and lets you inspect and modify the list of rules contained in the stylesheet."><code>CSSStyleSheet</code>
</a> object for the style sheet that contains this rule

#### **Type**: `null`

### .type <div class="specs"><i>W3C</i></div> {#type}

One of the <a href="#Type_constants">Type constants
</a> indicating the type of CSS rule.

#### **Type**: `null`
