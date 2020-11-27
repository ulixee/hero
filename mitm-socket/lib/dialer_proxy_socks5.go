package main

import (
	"fmt"
	"net"
	"net/url"
	"strings"

	"golang.org/x/net/proxy"
)

func DialAddrViaSock5Proxy(dialer net.Dialer, addr string, proxyUrl *url.URL, proxyAuth string) (net.Conn, error) {

	proxyHost := proxyUrl.Host

	if strings.IndexRune(proxyHost, ':') == -1 {
		proxyHost += ":1080"
	}

	socksAuth := getSocks5Auth(proxyAuth, proxyUrl.User)

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

func getSocks5Auth(proxyAuth string, proxyUrlUser *url.Userinfo) *proxy.Auth {
	var socksAuth *proxy.Auth = nil

	if proxyAuth != "" {
		var authParts = strings.Split(proxyAuth, ":")
		socksAuth = &proxy.Auth{
			User: authParts[0],
		}
		if len(authParts) > 1 {
			socksAuth.Password = authParts[1]
		}
	}

	if proxyUrlUser != nil {
		password, _ := proxyUrlUser.Password()
		socksAuth = &proxy.Auth{
			User:     proxyUrlUser.Username(),
			Password: password,
		}
	}
	return socksAuth
}
