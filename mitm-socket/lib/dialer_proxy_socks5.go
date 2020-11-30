package main

import (
	"fmt"
	"net"
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
		return nil, fmt.Errorf("Can't connect to the socks proxy: %s", err)
	}
	fmt.Printf("Got socks5 dialer %s to %s\n", proxyHost, addr)

	conn, err := socksDialer.Dial("tcp", addr)
	if err != nil {
		fmt.Printf("Error with socks5 dial %#v\n", err)
		return nil, err
	}

	return conn, nil
}
