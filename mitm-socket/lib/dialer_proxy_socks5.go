package main

import (
	"bufio"
	"crypto/tls"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net"
	"net/http"
	"net/url"
	"strings"

	"golang.org/x/net/proxy"
)

func DialAddrThroughProxy(dialer net.Dialer, addr string, proxyUrl string, proxyAuth string, allowInsecure bool) (net.Conn, error) {

	parsedProxyUrl, err := url.Parse(proxyUrl)
	if err != nil {
		log.Fatalf("Could not parse proxy url %#v\n", err)
	}
	isSecure, proxyHost, err := getCleanHost(parsedProxyUrl)

	if parsedProxyUrl.Scheme == "socks5" {
		socksAuth := getSocks5Auth(proxyAuth, parsedProxyUrl.User)
		return dialAddrThroughSocks5(dialer, addr, proxyHost, socksAuth)
	}

	fmt.Printf("Dialing proxy connect %s to %s\n", proxyHost, addr)
	connectReq := &http.Request{
		Method: "CONNECT",
		URL:    parsedProxyUrl,
		Host:   addr,
		Header: make(http.Header),
	}

	if proxyAuth == "" && parsedProxyUrl.User != nil {
		proxyAuth = parsedProxyUrl.User.String()
	}

	if proxyAuth != "" {
		connectReq.Header.Set("Proxy-Authorization", fmt.Sprintf("Basic %s", base64.StdEncoding.EncodeToString([]byte(proxyAuth))))
	}

	conn, err := dialer.Dial("tcp", proxyHost)
	if err != nil {
		return nil, err
	}

	if isSecure {
		proxyTlsConfig := &tls.Config{}
		if allowInsecure {
			proxyTlsConfig.InsecureSkipVerify = true
		} else {
			proxyTlsConfig.ServerName = proxyHost
		}

		// NOTE: this is just the "wrapper" tls connection to the proxy. NOT to the destination
		conn = tls.Client(conn, proxyTlsConfig)
	}

	err = connectReq.Write(conn)
	if err != nil {
		log.Fatalf("Writing CONNECT failed %#v\n", err)
	}
	// Read response.
	// Okay to use and discard buffered reader here, because
	// TLS server will not speak until spoken to.
	br := bufio.NewReader(conn)

	resp, err := http.ReadResponse(br, connectReq)
	if err != nil {
		conn.Close()
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, err := ioutil.ReadAll(io.LimitReader(resp.Body, 500))
		if err != nil {
			return nil, err
		}
		conn.Close()
		responseMessage := fmt.Sprintf("proxy refused connection(%d)\n%s", resp.StatusCode, string(body))
		return nil, errors.New(responseMessage)
	}
	return conn, nil
}

func dialAddrThroughSocks5(dialer net.Dialer, addr string, proxyHost string, socksAuth *proxy.Auth) (net.Conn, error) {
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

func getCleanHost(proxyUrl *url.URL) (bool, string, error) {
	var isSecure = false

	proxyHost := proxyUrl.Host

	if proxyUrl.Scheme == "" || proxyUrl.Scheme == "http" {
		if strings.IndexRune(proxyHost, ':') == -1 {
			proxyHost += ":80"
		}
	}

	if proxyUrl.Scheme == "https" || proxyUrl.Scheme == "wss" {
		isSecure = true
		if strings.IndexRune(proxyHost, ':') == -1 {
			proxyHost += ":443"
		}
	}

	if proxyUrl.Scheme == "socks" || proxyUrl.Scheme == "socks5" {
		if strings.IndexRune(proxyHost, ':') == -1 {
			proxyHost += ":1080"
		}
	}

	return isSecure, proxyHost, nil
}
