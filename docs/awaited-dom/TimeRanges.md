# [AwaitedDOM](/docs/hero/basic-client/awaited-dom) <span>/</span> TimeRanges

<div class='overview'>The <code>TimeRanges</code> interface is used to represent a set of time ranges, primarily for the purpose of tracking which portions of media have been buffered when loading it for use by the <code>&lt;audio&gt;</code> and <code>&lt;video&gt;</code>&nbsp;elements.</div>

<div class='overview'>A <code>TimeRanges</code> object includes one or more ranges of time, each specified by a starting and ending time offset. You reference each time range by using the <code>start()</code> and <code>end()</code> methods, passing the index number of the time range you want to retrieve.</div>

<div class='overview'>The term "<a class="external" href="https://www.w3.org/TR/html52/semantics-embedded-content.html#normalized-timeranges-object" rel="noopener">normalized TimeRanges object</a>" indicates that ranges in such an object are ordered, don't overlap, aren't empty, and don't touch (adjacent ranges are folded into one bigger range).</div>

## Properties

### .length <div class="specs"><i>W3C</i></div> {#length}

Returns an <code>unsigned long</code> representing the number of time ranges represented by the time range object.

#### **Type**: `Promise<number>`

## Methods

### .end *(index)* <div class="specs"><i>W3C</i></div> {#end}

Returns the time for the end of the specified range.

#### **Arguments**:


 - index `number`. <code>index</code> is the range number to return the ending time for.

#### **Returns**: `Promise<number>`

### .start *(index)* <div class="specs"><i>W3C</i></div> {#start}

Returns the time for the start of the range with the specified index.

#### **Arguments**:


 - index `number`. <code>index</code> is the range number to return the starting time for.

#### **Returns**: `Promise<number>`
