package main

import (
	"fmt"
	"io"
	"log"
	"net"
	"os"
	"os/signal"
	"sync/atomic"
	"syscall"
	"time"

	tls "github.com/ulixee/utls"
)

var (
	readTimeout = 30 * time.Second
)

type DomainSocketPiper struct {
	Path            string
	listener        net.Listener
	client          net.Conn
	completeCounter uint32
	keepAlive       bool
	debug           bool
}

func (piper *DomainSocketPiper) Listen() {
	/// Create server on Unix socket path
	ln, err := net.Listen("unix", piper.Path)
	if err != nil {
		log.Fatalf("DomainSocketPiper Listen error: %+v", err)
	}
	piper.listener = ln
}

func (piper *DomainSocketPiper) WaitForClient() {
	// only read one
	unixSocketClient, err := piper.listener.Accept()
	if err != nil {
		log.Fatalf("DomainSocketPiper Accept error: %+v", err)
	}

	piper.client = unixSocketClient
}

func (piper *DomainSocketPiper) Pipe(remoteConn net.Conn) {
	piper.completeCounter = 0
	localNotify := make(chan error, 1)  // close on signals
	remoteNotify := make(chan error, 1) // close on signals

	// also make a signals channel
	sigc := make(chan os.Signal, 1)
	signal.Notify(sigc, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)

	defer piper.Close()

	keepAlive := piper.keepAlive
	if !keepAlive {
		if uconn, ok := remoteConn.(*tls.UConn); ok {
			keepAlive = uconn.ConnectionState().NegotiatedProtocol == "h2"
		}
	}

	copyUntilTimeout := func(dst io.Writer, src net.Conn, notifyChan chan error, counter *uint32) {
		var err error
		var n int
		var one = make([]byte, 1)

		for {
			if atomic.LoadUint32(counter) > 0 {
				return
			}

			src.SetReadDeadline(time.Now().Add(readTimeout))
			n, err = src.Read(one)
			if err != nil {
				notifyChan <- err
			} else if n > 0 {
				dst.Write(one)
				_, err := io.Copy(dst, src)
				if err != nil {
					notifyChan <- err
				}
			}
		}
	}

	// Pipe data
	go copyUntilTimeout(remoteConn, piper.client, localNotify, &piper.completeCounter)
	go copyUntilTimeout(piper.client, remoteConn, remoteNotify, &piper.completeCounter)

	// Read until one of these errors occur
	var err error
	var neterr net.Error
	var ok bool
	for {
		select {
		case <-sigc:
			if piper.debug {
				fmt.Println("DomainSocket -> Sigc")
			}
			return

		case err = <-remoteNotify:
			if !keepAlive {
				if err == io.EOF {
					atomic.AddUint32(&piper.completeCounter, 1)
					if piper.debug {
						log.Printf("DomainSocket -> EOF")
					}
					return
				}

				if neterr, ok = err.(net.Error); ok && neterr.Timeout() {
					atomic.AddUint32(&piper.completeCounter, 1)
					if piper.debug {
						log.Printf("DomainSocket -> Read Timeout")
					}
					return
				}
			}

			neterr, ok = err.(net.Error)
			if err != io.EOF && (!ok || !neterr.Timeout()) {
				atomic.AddUint32(&piper.completeCounter, 1)
				if piper.debug {
					log.Printf("DomainSocket -> Error %#v", err)
				}
				return
			}

		case <-time.After(50 * time.Millisecond):
			if atomic.LoadUint32(&piper.completeCounter) > 0 {
				if piper.debug {
					fmt.Println("DomainSocket -> Closed")
				}
				return
			}
		}
	}
}

func (piper *DomainSocketPiper) Close() {
	atomic.AddUint32(&piper.completeCounter, 1)
	if piper.listener != nil {
		piper.listener.Close()
		piper.listener = nil
	}
	if piper.client != nil {
		piper.client.Close()
		piper.client = nil
	}
}
