package main

import (
	"log"
	"net"

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
	var helloID tls.ClientHelloID = tls.HelloChrome_72
	if connectArgs.ClientHelloId == "Safari13" {
		helloID = tls.HelloCustom
	}
	if connectArgs.ClientHelloId == "Chrome83" {
        helloID = tls.HelloChrome_83
    }
	tlsConfig := tls.Config{
		ServerName:         connectArgs.Servername,
		InsecureSkipVerify: !connectArgs.RejectUnauthorized,
	}

	tlsConn := tls.UClient(dialConn, &tlsConfig, helloID)
	if connectArgs.ClientHelloId == "Safari13" {
		err := tlsConn.ApplyPreset(&ClientHelloSafari13)
		if err != nil {
			log.Fatalf("Error building client hello. %#v", err)
		}
	}

	err = tlsConn.Handshake()
	if err != nil {
		log.Fatalf("Error on tls handshake with %s. Args %#v, tlsConn.Handshake error: %+v", dialConn.RemoteAddr().String(), connectArgs, err)
	}

	return tlsConn
}
