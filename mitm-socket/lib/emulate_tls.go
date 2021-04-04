package main

import (
	"log"
	"net"
	"strconv"
	"strings"

	tls "github.com/ulixee/utls"
)

var isInited = false

func EmulateTls(dialConn net.Conn, addr string, connectArgs ConnectArgs) *tls.UConn {
	if isInited == false {
		tls.EnableWeakCiphers()
		isInited = true
	}
	var err error

	// Upgrade connection with correct TLS signature
	var spec tls.ClientHelloSpec
	if connectArgs.ClientHelloId == "Safari13" {
		spec = GetSafari13Spec()
	} else if strings.HasPrefix(connectArgs.ClientHelloId, "Chrome") {
		chromeVersionBit := strings.Split(connectArgs.ClientHelloId, "Chrome")[1]
		chromeVersion, _ := strconv.ParseInt(chromeVersionBit, 10, 0)
		// lowest supported is chrome 72, otherwise channel id extensions crop up
		if chromeVersion < 83 {
			spec, _ = tls.UtlsIdToSpec(tls.HelloChrome_72)
		} else {
			spec, _ = tls.UtlsIdToSpec(tls.HelloChrome_83)
		}
	} else {
	    // default to chrome83
		spec, _ = tls.UtlsIdToSpec(tls.HelloChrome_83)
	}

	tlsConfig := tls.Config{
		ServerName:         connectArgs.Servername,
		InsecureSkipVerify: !connectArgs.RejectUnauthorized,
	}

	tlsConn := tls.UClient(dialConn, &tlsConfig, tls.HelloCustom)

	if connectArgs.DisableAlpn {
		tmp := spec.Extensions[:0]
		for _, ext := range spec.Extensions {
			if _, ok := ext.(*tls.ALPNExtension); !ok {
				tmp = append(tmp, ext)
			}
		}
		spec.Extensions = tmp
	}

	err = tlsConn.ApplyPreset(&spec)
	if err != nil {
		log.Fatalf("Error building client hello. %#v", err)
	}

	err = tlsConn.Handshake()
	if err != nil {
		log.Fatalf("Error on tls handshake with %s. Args %#v, tlsConn.Handshake error: %+v", dialConn.RemoteAddr().String(), connectArgs, err)
	}

	return tlsConn
}

func removeIndex(s []string, index int) []string {
	return append(s[:index], s[index+1:]...)
}
