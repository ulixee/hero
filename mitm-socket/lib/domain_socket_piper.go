package main

import (
	"fmt"
	"io"
	"log"
	"net"
	"os"
	"sync/atomic"
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

func (piper *DomainSocketPiper) WaitForClient() {
	// only read one
	unixSocketClient, err := piper.listener.Accept()
	if err != nil {
		log.Fatalf("DomainSocketPiper Accept error: %+v", err)
	}

	piper.client = unixSocketClient
}

func (piper *DomainSocketPiper) Pipe(remoteConn net.Conn, sigc chan os.Signal) {
	piper.completeCounter = 0
	localNotify := make(chan error, 1)  // close on signals
	remoteNotify := make(chan error, 1) // close on signals

	defer piper.Close()

	keepAlive := piper.keepAlive
	if !keepAlive {
		if uconn, ok := remoteConn.(*tls.UConn); ok {
			keepAlive = uconn.ConnectionState().NegotiatedProtocol == "h2"
		}
	}

	copyUntilTimeout := func(dst io.Writer, src net.Conn, notifyChan chan error, counter *uint32) {
		var readErr error
		var writeErr error
		var n int
		var data []byte = make([]byte, 4096)

		for {
			if atomic.LoadUint32(counter) > 0 {
				return
			}

			n, readErr = src.Read(data)

			if n > 0 {
				_, writeErr = dst.Write(data[:n])
				if writeErr != nil {
				    notifyChan <- writeErr
				}
			}

			if readErr != nil {
				notifyChan <- readErr
				if atomic.LoadUint32(counter) > 0 {
				    return
				}

				if readErr == io.EOF {
				    if n == 0 {
                        atomic.AddUint32(&piper.completeCounter, 1)
                        if piper.debug {
                            fmt.Println("DomainSocket -> 0 Byte EOF")
                        }
                        return
                    }
                    time.Sleep(1 * time.Second)
                }
			} else if n == 0 {
				time.Sleep(200 * time.Millisecond)
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
			atomic.AddUint32(&piper.completeCounter, 1)
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
			}

			neterr, ok = err.(net.Error)
			if err != io.EOF && (!ok || !neterr.Timeout()) {
				atomic.AddUint32(&piper.completeCounter, 1)
				if piper.debug {
					log.Printf("DomainSocket -> Error %#v", err)
				}
				return
			}

		case <-time.After(100 * time.Millisecond):
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
