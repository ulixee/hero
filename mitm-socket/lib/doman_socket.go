// +build !windows

package main

import (
	"log"
	"net"
)

func (piper *DomainSocketPiper) Listen() {
	/// Create server on Unix socket path
	ln, err := net.Listen("unix", piper.Path)
	if err != nil {
		log.Fatalf("DomainSocketPiper Listen error: %+v", err)
	}
	piper.listener = ln
}
