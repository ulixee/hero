// +build !windows

package main

import (
	"net"
)

func ListenOnDomain(path string) (net.Listener, error) {
	/// Create server on Unix socket path
	ln, err := net.Listen("unix", path)
	if err != nil {
		return nil, err
	}
	return ln, nil
}

func DialOnDomain(path string) (net.Conn, error) {
	conn, err := net.Dial("unix", path)
	if err != nil {
		return nil, err
	}
	return conn, nil
}
