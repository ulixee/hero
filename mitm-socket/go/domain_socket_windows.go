// +build windows

package main

import (
    "net"
	winio "github.com/Microsoft/go-winio"
)

func ListenOnDomain(path string) (net.Listener, error) {
	// Create server on Windows Named Pipe
	ln, err := winio.ListenPipe(path, nil)
	if err != nil {
		return nil, err
	}
	return ln, nil
}

func DialOnDomain(path string) (net.Conn, error) {
	conn, err := winio.DialPipe(path, nil)
	if err != nil {
		return nil, err
	}
	return conn, nil
}
