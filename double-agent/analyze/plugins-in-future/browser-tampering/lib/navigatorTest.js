// function navigatorTest() {
//   //language
//   //resolution
//   // screen size /offset is possible (fingerprint this?)
//   //platform
//   //timezone
//   //webgl driver
//   //memory/heap size is possible
//   //vendor
//   //subproduct
//   //https://github.com/ghostwords/chameleon/blob/a1a6c20616a56b4896240536aafef76cd6cde0ca/src/js/injected.js#L142
// }
//
//
// // Courtesy of https://davidwalsh.name/detect-native-function
// (function() {
//   // Used to resolve the internal `[[Class]]` of values
//   var toString = Object.prototype.toString;
//
//   // Used to resolve the decompiled source of functions
//   var fnToString = Function.prototype.toString;
//
//   // Used to detect host constructors (Safari > 4; really typed array specific)
//   var reHostCtor = /^\[object .+?Constructor\]$/;
//
//   // Compile a regexp using a common native method as a template.
//   // We chose `Object#toString` because there's a good chance it is not being mucked with.
//   var reNative = RegExp(
//     '^' +
//       // Coerce `Object#toString` to a string
//       String(toString)
//         // Escape any special regexp characters
//         .replace(/[.*+?^${}()|[\]\/\\]/g, '\\$&')
//         // Replace mentions of `toString` with `.*?` to keep the template generic.
//         // Replace thing like `for ...` to support environments like Rhino which add extra info
//         // such as method arity.
//         .replace(/toString|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') +
//       '$',
//   );
//
//   function isNative(value) {
//     var type = typeof value;
//     return type == 'function'
//       ? // Use `Function#toString` to bypass the value's own `toString` method
//         // and avoid being faked out.
//         reNative.test(fnToString.call(value))
//       : // Fallback to a host object check because some environments will represent
//         // things like typed arrays as DOM methods which may not conform to the
//         // normal native pattern.
//         (value && type == 'object' && reHostCtor.test(toString.call(value))) || false;
//   }
//
//   // export however you want
//   module.exports = isNative;
// })();
//# sourceMappingURL=navigatorTest.js.map