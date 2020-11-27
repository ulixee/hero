package main

import (
	"net"
	"net/url"
	"time"
)

func Dial(addr string, connectArgs ConnectArgs) (net.Conn, error) {
	var dialTimeout = time.Duration(15) * time.Second

	/// Dial the server
	dialer := net.Dialer{
		Control: ConfigureSocket(connectArgs.TcpTtl, connectArgs.TcpWindowSize),
		Timeout: dialTimeout,
	}

	if connectArgs.ProxyUrl != "" {
		proxyUrl, err := url.Parse(connectArgs.ProxyUrl)
		if err != nil {
			return nil, err
		}

		if proxyUrl.Scheme == "socks5" {
			return DialAddrViaSock5Proxy(dialer, addr, proxyUrl, connectArgs.ProxyAuth)
		}

		return DialAddrViaHttpProxy(dialer, addr, proxyUrl, connectArgs.ProxyAuth, !connectArgs.RejectUnauthorized)
	}

	dialConn, err := dialer.Dial("tcp", addr)
	if err != nil {
		return nil, err
	}
	return dialConn, nil
}
