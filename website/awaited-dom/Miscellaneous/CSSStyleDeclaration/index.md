# CSSStyleDeclaration

<div class='overview'>The <strong><code>CSSStyleDeclaration</code></strong> interface represents an object that is a CSS declaration block, and exposes style information and various style-related methods and properties.</div>

<div class='overview'>A <code>CSSStyleDeclaration</code> object can be exposed using three different APIs:</div>

## Properties

<ul class="items properties">
  <li>
    <a href="">cssFloat</a>
    <div>The cssFloat attribute can be set for elements that generate boxes that are not absolutely positioned. The cssFloat attribute corresponds to the float Cascading Style Sheets (CSS) property. Getting this attribute is equivalent to calling the getProperty method. Setting this attribute is equivalent to calling the setProperty method.</div>
  </li>
  <li>
    <a href="">cssText</a>
    <div>Textual representation of the declaration block. Setting this attribute changes the style.</div>
  </li>
  <li>
    <a href="">length</a>
    <div>The number of properties. See the <a href="/en-US/docs/Web/API/CSSStyleDeclaration/item" title="The CSSStyleDeclaration.item() method interface returns a CSS property name from a CSSStyleDeclaration by index"><code>item()</code></a> method below.</div>
  </li>
  <li>
    <a href="">parentRule</a>
    <div>The containing <a href="/en-US/docs/Web/API/CSSRule" title="The CSSRule interface represents a single CSS rule. There are several types of rules, listed in the Type constants section below."><code>CSSRule</code></a>.</div>
  </li>
</ul>

## Methods

<ul class="items methods">
  <li>
    <a href="">getPropertyPriority()</a>
    <div>Returns the optional priority, "important".</div>
  </li>
  <li>
    <a href="">getPropertyValue()</a>
    <div>Returns the property value given a property name.</div>
  </li>
  <li>
    <a href="">item()</a>
    <div>Returns a property name.</div>
  </li>
  <li>
    <a href="">removeProperty()</a>
    <div>Removes a property from the CSS declaration block.</div>
  </li>
  <li>
    <a href="">setProperty()</a>
    <div>Modifies an existing CSS property or creates a new CSS property in the declaration block.</div>
  </li>
</ul>

## Events
