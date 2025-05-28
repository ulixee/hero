package main

import (
	tls "github.com/refraction-networking/utls"
)

// TODO: move this to a json format that's sent in.. thus the raw values
func GetSafari13Spec() tls.ClientHelloSpec {
	return tls.ClientHelloSpec{
		CipherSuites: []uint16{
			0x1301,
			0x1302,
			0x1303,
			0xC02C,
			0xC02B,
			0xC024,
			0xC023,
			0xC00A,
			0xC009,
			0xCCA9,
			0xC030,
			0xC02F,
			0xC028,
			0xC027,
			0xC014,
			0xC013,
			0xCCA8,
			0x009D,
			0x009C,
			0x003D,
			0x003C,
			0x0035,
			0x002F,
			0xC008,
			0xC012,
			0x000A,
		},
		CompressionMethods: []byte{
			0x00,
		},
		Extensions: []tls.TLSExtension{
			&tls.RenegotiationInfoExtension{Renegotiation: tls.RenegotiateOnceAsClient},
			&tls.SNIExtension{},
			&tls.UtlsExtendedMasterSecretExtension{},
			&tls.SignatureAlgorithmsExtension{SupportedSignatureAlgorithms: []tls.SignatureScheme{
				0x0403,
				0x0804,
				0x0401,
				0x0503,
				0x0203,
				0x0805,
				0x0805,
				0x0501,
				0x0806,
				0x0601,
				0x0201,
			}},
			&tls.StatusRequestExtension{},
			&tls.SCTExtension{},
			&tls.ALPNExtension{AlpnProtocols: []string{"h2", "http/1.1"}},
			&tls.SupportedPointsExtension{SupportedPoints: []byte{
				uint8(0),
			}},
			&tls.KeyShareExtension{[]tls.KeyShare{
				{Group: tls.CurveID(29)},
			}},
			&tls.PSKKeyExchangeModesExtension{[]uint8{1}},
			&tls.SupportedVersionsExtension{[]uint16{
				uint16(772),
				uint16(771),
				uint16(770),
				uint16(769),
			}},
			&tls.SupportedCurvesExtension{[]tls.CurveID{
				tls.CurveID(29),
				tls.CurveID(23),
				tls.CurveID(24),
				tls.CurveID(25),
			}},
			&tls.UtlsPaddingExtension{GetPaddingLen: tls.BoringPaddingStyle},
		},
	}
}
