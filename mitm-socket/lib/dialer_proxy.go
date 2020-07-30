package main

import (
	"bufio"
	"crypto/tls"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net"
	"net/http"
	"net/url"
	"strings"
)

func DialAddrThroughProxy(addr string, proxyUrl string, proxyAuth string, allowInsecure bool) (net.Conn, error) {

	isSecure, proxyHost, err := getCleanHost(proxyUrl)
	fmt.Printf("Dialing proxy connect %s to %s\n", proxyHost, addr)
	connectReq := &http.Request{
		Method: "CONNECT",
		URL:    &url.URL{Opaque: addr},
		Host:   addr,
		Header: make(http.Header),
	}

	if proxyAuth != "" {
		connectReq.Header.Set("Proxy-Authorization", fmt.Sprintf("Basic %s", proxyAuth))
	}

	conn, err := net.Dial("tcp", proxyHost)
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
		fmt.Printf("Non 200")
		return nil, errors.New("proxy refused connection" + string(body))
	}
	return conn, nil
}

func getCleanHost(proxyUrl string) (bool, string, error) {
	parsedProxyUrl, err := url.Parse(proxyUrl)
	if err != nil {
		return false, "", err
	}

	var isSecure = false

	proxyHost := parsedProxyUrl.Host

	if parsedProxyUrl.Scheme == "" || parsedProxyUrl.Scheme == "http" {
		if strings.IndexRune(proxyHost, ':') == -1 {
			proxyHost += ":80"
		}
	}

	if parsedProxyUrl.Scheme == "https" || parsedProxyUrl.Scheme == "wss" {
		isSecure = true
		if strings.IndexRune(proxyHost, ':') == -1 {
			proxyHost += ":443"
		}
	}

	return isSecure, parsedProxyUrl.Host, nil
}
