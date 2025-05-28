package main

import (
	"net"
	"net/url"
	"time"
)

func Dial(addr string, connectArgs ConnectArgs, sessionArgs SessionArgs) (net.Conn, error) {
	var dialTimeout = time.Duration(15) * time.Second

	/// Dial the server
	dialer := net.Dialer{
		Control: ConfigureSocket(sessionArgs.TcpTtl, sessionArgs.TcpWindowSize),
		Timeout: dialTimeout,
	}

	if connectArgs.ProxyUrl != "" {
		proxyUrl, err := url.Parse(connectArgs.ProxyUrl)
		if err != nil {
			return nil, err
		}

		if proxyUrl.Scheme == "socks5" || proxyUrl.Scheme == "socks5h" {
			return DialAddrViaSock5Proxy(dialer, addr, proxyUrl)
		}

		return DialAddrViaHttpProxy(dialer, addr, proxyUrl, !sessionArgs.RejectUnauthorized, sessionArgs.UserAgent)
	}

	dialConn, err := dialer.Dial("tcp", addr)
	if err != nil {
		return nil, err
	}

	tcpConn, ok := dialConn.(*net.TCPConn)
	if ok {
		if connectArgs.KeepAlive {
			tcpConn.SetKeepAlive(true)
		}
		tcpConn.SetNoDelay(connectArgs.IsWebsocket)
		tcpConn.SetLinger(0)
	}

	return dialConn, nil
}
