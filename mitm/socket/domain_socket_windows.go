// +build windows

package main

import (
	"log"

	winio "github.com/Microsoft/go-winio"
)

func (piper *DomainSocketPiper) Listen() {
	// Create server on Windows Named Pipe
	ln, err := winio.ListenPipe(piper.Path, nil)
	if err != nil {
		log.Fatalf("DomainSocketPiper Listen error: %+v", err)
	}
	piper.listener = ln
}
