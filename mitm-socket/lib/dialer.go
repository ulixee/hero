package main

import (
	"net"
	"time"
)

func Dial(addr string, connectArgs ConnectArgs) (net.Conn, error) {
	if connectArgs.ProxyUrl != "" {
		return DialAddrThroughProxy(
			addr,
			connectArgs.ProxyUrl,
			connectArgs.ProxyAuthBase64,
			!connectArgs.RejectUnauthorized,
		)
	} else {
		return dialAddr(addr, connectArgs.TcpTtl, connectArgs.TcpWindowSize)
	}
}

func dialAddr(addr string, ttl int, windowSize int) (net.Conn, error) {
	var dialTimeout = time.Duration(15) * time.Second

	/// Dial the server
	dialer := net.Dialer{
		Control: ConfigureSocket(ttl, windowSize),
		Timeout: dialTimeout,
	}

	dialConn, err := dialer.Dial("tcp", addr)
	if err != nil {
		return nil, err
	}

	return dialConn, nil
}
