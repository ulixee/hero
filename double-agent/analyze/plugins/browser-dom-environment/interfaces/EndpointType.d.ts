declare enum EndpointType {
    keyOrder = "keyOrder",
    flags = "flags",
    prototype = "prototype",
    number = "number",
    function = "function",
    string = "string",
    stacktrace = "stacktrace",
    getter = "getter",
    setter = "setter",
    class = "class",
    ref = "ref",
    boolean = "boolean",
    array = "array",
    symbol = "symbol",
    type = "type",
    webdriver = "webdriver"
}
export default EndpointType;
export type IEndpointType = keyof typeof EndpointType;
