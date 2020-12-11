package main

import (
	"fmt"
	"net"
	"errors"
	"net/url"
	"strings"

	"golang.org/x/net/proxy"
)

func DialAddrViaSock5Proxy(dialer net.Dialer, addr string, proxyUrl *url.URL) (net.Conn, error) {
    var socksAuth *proxy.Auth = nil

	proxyHost := proxyUrl.Host

	if strings.IndexRune(proxyHost, ':') == -1 {
		proxyHost += ":1080"
	}

	if proxyUrl.User != nil {
		password, _ := proxyUrl.User.Password()
		socksAuth = &proxy.Auth{
			User:     proxyUrl.User.Username(),
			Password: password,
		}
	}

	fmt.Printf("Connecting via socks5 proxy %s to %s\n", proxyHost, addr)

	socksDialer, err := proxy.SOCKS5("tcp", proxyHost, socksAuth, proxy.Direct)
	if err != nil {
		responseMessage := fmt.Sprintf("SOCKS5_PROXY_ERR connection failed (%s)", err)
		return nil, errors.New(responseMessage)
	}
	fmt.Printf("Got socks5 dialer %s to %s\n", proxyHost, addr)

	conn, err := socksDialer.Dial("tcp", addr)
	if err != nil {
		responseMessage := fmt.Sprintf("SOCKS5_PROXY_ERR dial failed (%s)", err)
		return nil, errors.New(responseMessage)
	}

	return conn, nil
}
