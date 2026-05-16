## Detections using TLS conversation:

- ClientHello ciphers, compressions and fingerprints
- TLS Grease (currently only supported in BoringSSL). Part of fingerprinting
- BoringSSL error responses

NOTE: Preliminary implementation to examine ClientHello just uses output from OpenSSL. Future version should parse actual client hello packets
https://github.com/seladb/PcapPlusPlus
https://github.com/LeeBrotherston/tls-fingerprinting
https://github.com/ctz/rustls

### ClientHello

TLS has a ClientHello tcp message sent by the client with the ciphers and extensions it proposes using.

These ciphers vary by platform and even app. There are tls fingerprint tools built to try to determine
which application is making an http call.
Fingerprints: https://github.com/salesforce/ja3

For instance, Chrome 79:
Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36
JA3 MD5 Hash 0BE8FDD9423BE87F8FCF9A7349F3AD2D
JA3 Fingerprint 772,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53-10,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-21,29-23-24,

0x9a9a TLS_GREASE_9A GREASE
0x1301 TLS_AES_128_GCM_SHA256 Good
0x1302 TLS_AES_256_GCM_SHA384 Good
0x1303 TLS_CHACHA20_POLY1305_SHA256 Good
0xc02b TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256 Good
0xc02f TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256 Good
0xc02c TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384 Good
0xc030 TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384 Good
0xcca9 TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256 Good
0xcca8 TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256 Good
0xc013 TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA CBC, SHA-1
0xc014 TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA CBC, SHA-1
0x009c TLS_RSA_WITH_AES_128_GCM_SHA256 NO PFS
0x009d TLS_RSA_WITH_AES_256_GCM_SHA384 NO PFS
0x002f TLS_RSA_WITH_AES_128_CBC_SHA NO PFS, CBC, SHA-1
0x0035 TLS_RSA_WITH_AES_256_CBC_SHA NO PFS, CBC, SHA-1
0x000a TLS_RSA_WITH_3DES_EDE_CBC_SHA NO PFS, CBC, 3DES, SHA-1

Named Groups
0xfafa GREASE
0x001d x25519
0x0017 secp256r1
0x0018 secp384r1

Supported TLS Extensions (in order as received)
TLS Extensions
0x0000 server_name
0x0017 extended_master_secret
0xff01 renegotiation_info
0x000a supported_groups
0x000b ec_point_formats
0x0023 session_ticket
0x0010 application_layer_protocol_negotiation
0x0005 status_request
0x000d signature_algorithms
0x0012 signed_certificate_timestamp
0x0033 key_share
0x002d psk_key_exchange_modes
0x002b supported_versions
0x001b compress_certificate
0x0015 padding

Curl:

### Resources:

Fingerprinting:
https://github.com/cisco/joy - database of fingerprints: https://github.com/cisco/joy/blob/master/fingerprinting/resources/fingerprint_db.json.gz
https://github.com/google/boringssl: - https://github.com/google/boringssl/blob/master/ssl/handshake_client.cc#L224
https://github.com/refraction-networking/utls
https://tlsfingerprint.io/
https://tools.ietf.org/html/draft-davidben-tls-grease-01#section-5
https://browserleaks.com/ssl
https://www.ssllabs.com/ssltest/clients.html
https://tools.ietf.org/html/rfc8446

## ToDo

We're not checking the details of every extension. Need to investigate this more.
