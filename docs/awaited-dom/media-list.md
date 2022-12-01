# [AwaitedDOM](../basic-client/awaited-dom) <span>/</span> MediaList

<div class='overview'>The <code><strong>MediaList</strong></code> interface represents the media queries of a stylesheet, e.g. those set using a <code>&lt;link&gt;</code> element's <code>media</code> attribute.</div>

## Properties

### .length <div class="specs"><i>W3C</i></div> {#length}

Returns the number of media queries in the <code>MediaList</code>.

#### **Type**: `Promise<number>`

## Methods

### .appendMedium *(medium)* <div class="specs"><i>W3C</i></div> {#appendMedium}

Adds a media query to the <code>MediaList</code>.

#### **Arguments**:


 - medium `string`. Needs content.

#### **Returns**: `Promise<void>`

### .deleteMedium *(medium)* <div class="specs"><i>W3C</i></div> {#deleteMedium}

Removes a media query from the <code>MediaList</code>.

#### **Arguments**:


 - medium `string`. Needs content.

#### **Returns**: `Promise<void>`

### .item *(index)* <div class="specs"><i>W3C</i></div> {#item}

A getter that returns a <code>CSSOMString</code> representing a media query as text, given the media query's index value inside the <code>MediaList</code>.

#### **Arguments**:


 - index `number`. Needs content.

#### **Returns**: `Promise<string>`

## Unimplemented Specs

#### Properties

|     |     |
| --- | --- |
| `mediaText` |  |
