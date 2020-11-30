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
)

func DialAddrViaHttpProxy(dialer net.Dialer, addr string, proxyUrl *url.URL, allowInsecure bool) (net.Conn, error) {
  	isSecure, proxyHost, err := getCleanHost(proxyUrl)

	fmt.Printf("Dialing proxy connect %s to %s\n", proxyHost, addr)
	connectReq := &http.Request{
		Method: "CONNECT",
		URL:    proxyUrl,
		Host:   addr,
		Header: make(http.Header),
	}

    if proxyUrl.User != nil {
		proxyAuth := proxyUrl.User.String()
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

	return isSecure, proxyHost, nil
}
