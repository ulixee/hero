# [AwaitedDOM](../basic-client/awaited-dom) <span>/</span> SVGTransform

<div class='overview'><code>SVGTransform</code> is the interface for one of the component transformations within an <code>SVGTransformList</code>; thus, an <code>SVGTransform</code> object corresponds to a single component (e.g., <code>scale(…)</code> or <code>matrix(…)</code>) within a <code>transform</code> attribute.</div>

<div class='overview'>An <code>SVGTransform</code> object can be designated as read only, which means that attempts to modify the object will result in an exception being thrown.</div>

## Unimplemented Specs

#### Properties

|     |     |
| --- | --- |
| `angle` | `matrix` |
| `type` |  |

#### Methods

|     |     |
| --- | --- |
| `setMatrix()` | `setRotate()` |
| `setScale()` | `setSkewX()` |
| `setSkewY()` | `setTranslate()` |
