package main

import (
	"encoding/base64"
	"io"
	"net"
	"os"
	"strconv"
	"strings"

	tls "github.com/refraction-networking/utls"
)

var isInited = false

func EmulateTls(dialConn net.Conn, addr string, sessionArgs SessionArgs, connectArgs ConnectArgs) (*tls.UConn, error) {
	if isInited == false {
		tls.EnableWeakCiphers()
		isInited = true
	}
	var err error

	// Upgrade connection with correct TLS signature
	var spec tls.ClientHelloSpec
	if sessionArgs.ClientHelloId == "Safari13" {
		spec = GetSafari13Spec()
	} else if strings.HasPrefix(sessionArgs.ClientHelloId, "chrome-") {
		chromeVersionBit := strings.Split(sessionArgs.ClientHelloId, "chrome-")[1]
		chromeVersion, _ := strconv.ParseInt(chromeVersionBit, 10, 0)
		// lowest supported is chrome 72, otherwise channel id extensions crop up
		if chromeVersion < 83 {
			spec, _ = tls.UTLSIdToSpec(tls.HelloChrome_72)
		} else if chromeVersion < 91 {
			// application settings added in chrome 91
			spec, _ = tls.UTLSIdToSpec(tls.HelloChrome_83)
		} else if chromeVersion < 98 {
			// chrome 98 removed tls 1.1, 1.0
			spec, _ = tls.UTLSIdToSpec(tls.HelloChrome_96)
		} else if chromeVersion < 110 {
			// chrome 110 implemented shuffling
			spec, _ = tls.UTLSIdToSpec(tls.HelloChrome_100)
		} else if chromeVersion < 119 {
			spec, _ = tls.UTLSIdToSpec(tls.HelloChrome_106_Shuffle)
		} else if chromeVersion < 124 {
			spec, _ = tls.UTLSIdToSpec(tls.HelloChrome_120)
		} else if chromeVersion < 131 {
			spec, _ = tls.UTLSIdToSpec(tls.HelloChrome_120_PQ)
		} else {
			// Chrome 131+ uses the latest available Chrome PQ spec
			spec, _ = tls.UTLSIdToSpec(tls.HelloChrome_131)
		}
	} else {
		// default to latest shuffle
		spec, _ = tls.UTLSIdToSpec(tls.HelloChrome_106_Shuffle)
	}

	tlsConfig := tls.Config{
		ServerName:         connectArgs.Servername,
		InsecureSkipVerify: !sessionArgs.RejectUnauthorized,
	}

	if connectArgs.KeylogPath != "" {
		var keylog io.Writer
		keylog, err = os.OpenFile(connectArgs.KeylogPath, os.O_WRONLY|os.O_CREATE|os.O_APPEND, 0640)
		if err != nil {
			return nil, err
		}
		tlsConfig.KeyLogWriter = keylog
	}

	if connectArgs.ApplicationSettings != nil {
		tlsConfig.ApplicationSettings = make(map[string][]byte)
		for k, v := range connectArgs.ApplicationSettings {
			value, err := base64.StdEncoding.DecodeString(v)
			if err == nil {
				tlsConfig.ApplicationSettings[k] = value
			}
		}
	}

	tlsConn := tls.UClient(dialConn, &tlsConfig, tls.HelloCustom)

	if connectArgs.IsWebsocket {
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
		return nil, err
	}

	err = tlsConn.Handshake()
	if err != nil {
		return nil, err
	}

	return tlsConn, nil
}

func removeIndex(s []string, index int) []string {
	return append(s[:index], s[index+1:]...)
}
