# CSSStyleSheet

<div class='overview'><span class="seoSummary">The <strong><code>CSSStyleSheet</code></strong> interface represents a single <a href="/en-US/docs/Web/CSS">CSS</a> stylesheet, and lets you inspect and modify the list of rules contained in the stylesheet.</span> It inherits properties and methods from its parent, <a href="/en-US/docs/Web/API/StyleSheet" title="An object implementing the StyleSheet interface represents a single style sheet. CSS style sheets will further implement the more specialized CSSStyleSheet interface."><code>StyleSheet</code></a>.</div>

<div class='overview'>A stylesheet consists of a collection of <a href="/en-US/docs/Web/API/CSSRule" title="The CSSRule interface represents a single CSS rule. There are several types of rules, listed in the Type constants section below."><code>CSSRule</code></a> objects representing each of the rules in the stylesheet. The rules are contained in a <a href="/en-US/docs/Web/API/CSSRuleList" title="A CSSRuleList is an (indirect-modify only) array-like object containing an ordered collection of CSSRule objects."><code>CSSRuleList</code></a>, which can be obtained from the stylesheet's <a href="/en-US/docs/Web/API/CSSStyleSheet/cssRules" title="The read-only CSSStyleSheet property cssRules returns a live CSSRuleList which provides a real-time, up-to-date list of every CSS rule which comprises the stylesheet."><code>cssRules</code></a> property.</div>

<div class='overview'>For example, one rule might be a <a href="/en-US/docs/Web/API/CSSStyleRule" title="CSSStyleRule represents a single CSS style rule. It implements the CSSRule interface with a type value of 1 (CSSRule.STYLE_RULE)."><code>CSSStyleRule</code></a> object containing a style such as:</div>

## Properties

### .cssRules <div class="specs"><i>W3C</i></div> {#cssRules}


 <p>Returns a live <a href="/en-US/docs/Web/API/CSSRuleList" title="A CSSRuleList is an (indirect-modify only) array-like object containing an ordered collection of CSSRule objects."><code>CSSRuleList</code></a> which maintains an up-to-date list of the <a href="/en-US/docs/Web/API/CSSRule" title="The CSSRule interface represents a single CSS rule. There are several types of rules, listed in the Type constants section below."><code>CSSRule</code></a> objects that comprise the stylesheet.</p>
 <p>This is normally used to access individual rules like this:</p>
 <pre><code>styleSheet.cssRules[i] // where i = 0..cssRules.length-1</code></pre>
 <p>To add or remove items in <code>cssRules</code>, use the&nbsp;<code>CSSStyleSheet</code>'s <a href="/en-US/docs/Web/API/CSSStyleSheet/insertRule" title="The CSSStyleSheet.insertRule() method inserts a new CSS rule into the current style sheet, with some restrictions."><code>insertRule()</code></a> and <a href="/en-US/docs/Web/API/CSSStyleSheet/deleteRule" title="The CSSStyleSheet method deleteRule() removes a rule from the stylesheet object."><code>deleteRule()</code></a> methods.</p>
 

#### **Type**: `SuperDocument`

### .ownerRule <div class="specs"><i>W3C</i></div> {#ownerRule}

If this stylesheet is imported into the document using an <a href="/en-US/docs/Web/CSS/@import" title="The @import CSS at-rule is used to import style rules from other style sheets. These rules must precede all other types of rules, except @charset rules; as it is not a nested statement, @import cannot be used inside conditional group at-rules."><code>@import</code></a> rule, the <code>ownerRule</code> property returns the corresponding <a class="new" href="/en-US/docs/Web/API/CSSImportRule" rel="nofollow" title="The documentation about this has not yet been written; please consider contributing!"><code>CSSImportRule</code></a>; otherwise, this property's value is <code>null</code>.

#### **Type**: `SuperDocument`

## Methods

### .deleteRule*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#deleteRule}

Deletes the rule at the specified index into the stylesheet's rule list.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

### .insertRule*(requestInput, requestInit)* <div class="specs"><i>W3C</i></div> {#insertRule}

Inserts a new rule at the specified position in the stylesheet, given the textual representation of the rule.

#### **Arguments**:


 - none

#### **Returns**: `Promise<Response>`

## Events
