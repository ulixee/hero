// import { cleanGrease } from './buildJa3';
// import { IClientHello } from './parseHelloMessage';
// import crypto from 'crypto';
// import IJa3Details from '../interfaces/IJa3Details';
// import IJa3 from '../interfaces/IJa3';
//
// /**
//  * This extension aims to identify when fields are left out for specifically identifying
//  * user-agents purporting to be Chrome, but missing key attributes.
//  *
//  * Ja3 extended adds to the fields of Ja3, but instead of fully removing Greased values, it includes
//  * a flag indicating if Grease was included. This value is simply a 1 if true
//  *
//  * Additionally, Extended Ja3 accounts for tls 1.3.
//  *
//  * Alpn fields are inserted as strings
//  *
//  * NOTE: considered padding since PSK now comes through to resume session, but it creates 2 different fingerprints per unique sender
//  *
//  * Original Ja3: SSLVersion,Cipher,SSLExtension,EllipticCurve,EllipticCurvePointFormat
//  * Extended Ja3: SSLVersion,Cipher,SSLExtension,EllipticCurve,EllipticCurvePointFormat,SignatureAlgorithms,TlsVersions,Alpn,IsGreased
//  * @param ja3Details
//  * @param clientHello
//  */
// export default function buildJa3Extended(ja3Details: IJa3Details, clientHello: IClientHello) {
//   const tlsVersions = clientHello.extensions
//     .find(x => x.type === 'supported_versions')
//     ?.values.map(x =>
//       Number(
//         x
//           .split('(')
//           .pop()
//           .replace(')', ''),
//       ),
//     );
//
//   const isGreased = ja3Details.value !== ja3Details.uncleaned ? 1 : 0;
//   const alpn =
//     clientHello.extensions
//       .find(x => x.type === 'application_layer_protocol_negotiation')
//       ?.values.join('-') ?? '';
//
//   const signatureAlgos = clientHello.extensions
//     .find(x => x.type === 'signature_algorithms')
//     ?.values.map(x =>
//       Number(
//         x
//           .split('(')
//           .pop()
//           .replace(')', ''),
//       ),
//     );
//
//   const ja3Extended = `${ja3Details.value},${cleanGrease(signatureAlgos)},${cleanGrease(
//     tlsVersions,
//   )},${alpn},${isGreased}`;
//
//   return {
//     value: ja3Extended,
//     md5: crypto
//       .createHash('md5')
//       .update(ja3Extended)
//       .digest('hex'),
//   } as IJa3;
// }
//
// export function isGreased(ja3Value: string) {
//   return ja3Value.endsWith(',1');
// }
//# sourceMappingURL=buildJa3Extended.js.map