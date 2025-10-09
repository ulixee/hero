package main

import (
	"bufio"
	"bytes"
	"crypto/tls"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"io/ioutil"
	"net"
	"net/http"
	"net/url"
	"strings"
)

func DialAddrViaHttpProxy(dialer net.Dialer, addr string, proxyUrl *url.URL, allowInsecure bool, userAgent string) (net.Conn, error) {
	isSecure, proxyHost, err := getCleanHost(proxyUrl)

	fmt.Printf("Dialing proxy connect %s to %s\n", proxyHost, addr)
	connectReq := &http.Request{
		Method: "CONNECT",
		URL:    proxyUrl,
		Host:   addr,
		Header: make(http.Header),
	}
    if userAgent != "" {
	    connectReq.Header.Set("User-Agent", userAgent)
	}

	if proxyUrl.User != nil {
		authBuffer := bytes.NewBuffer(nil)
		authEncoder := base64.NewEncoder(base64.StdEncoding, authBuffer)
		authEncoder.Write([]byte(proxyUrl.User.Username()))
		if password, passwordSet := proxyUrl.User.Password(); passwordSet {
			authEncoder.Write([]byte{':'})
			authEncoder.Write([]byte(password))
		}
		authEncoder.Close() // flush any partially written blocks
		connectReq.Header.Set("Proxy-Authorization", fmt.Sprintf("Basic %s", authBuffer.Bytes()))
	}

	conn, err := dialer.Dial("tcp", proxyHost)
	if err != nil {
		responseMessage := fmt.Sprintf("HTTP_PROXY_ERR dial failed (%s)", err)
		return nil, errors.New(responseMessage)
	}

	if isSecure {
		proxyTlsConfig := &tls.Config{}
		if allowInsecure {
			proxyTlsConfig.InsecureSkipVerify = true
		} else {
			sn, _, err := net.SplitHostPort(proxyHost)
			if err != nil {
				responseMessage := fmt.Sprintf("HTTP_PROXY_ERR invalid proxy host format: '%s' (%s)", proxyHost, err)
				return nil, errors.New(responseMessage)
			}
			proxyTlsConfig.ServerName = sn
		}

		// NOTE: this is just the "wrapper" tls connection to the proxy. NOT to the destination
		conn = tls.Client(conn, proxyTlsConfig)
	}

	err = connectReq.Write(conn)
	if err != nil {
		responseMessage := fmt.Sprintf("HTTP_PROXY_ERR writing CONNECT request failed (%s)", err)
		return nil, errors.New(responseMessage)
	}
	// Read response.
	// Okay to use and discard buffered reader here, because
	// TLS server will not speak until spoken to.
	br := bufio.NewReader(conn)

	resp, err := http.ReadResponse(br, connectReq)
	if err != nil {
		conn.Close()
		responseMessage := fmt.Sprintf("HTTP_PROXY_ERR reading CONNECT response failed (%s)", err)
		return nil, errors.New(responseMessage)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, err := ioutil.ReadAll(io.LimitReader(resp.Body, 500))
		if err != nil {
			return nil, err
		}
		conn.Close()
		responseMessage := fmt.Sprintf("HTTP_PROXY_ERR connection refused (%d)\n%s", resp.StatusCode, string(body))
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
