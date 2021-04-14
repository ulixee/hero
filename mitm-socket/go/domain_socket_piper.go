package main

import (
	"fmt"
	"io"
	"net"
	"os"
	"time"
)

type DomainSocketPiper struct {
	Id          int
	client      net.Conn
	doneChannel chan bool
	debug       bool
}

func (piper *DomainSocketPiper) Pipe(remoteConn net.Conn, sigc chan os.Signal) {
	piper.doneChannel = make(chan bool)

	copy := func(dst io.Writer, src net.Conn, doneChannel chan bool) {
		defer func() {
			doneChannel <- true
		}()

		var readErr error
		var writeErr error
		var n int
		var data []byte = make([]byte, 32*1024)

		for {
			n, readErr = src.Read(data)

			if n > 0 {
				_, writeErr = dst.Write(data[:n])
				if writeErr != nil {
					SendErrorToIpc(piper.Id, "writeData", writeErr)
					return
				}
			}

			if readErr == nil && n > 0 {
			    continue;
            }

            if readErr == io.EOF {
                if n == 0 {
                    return
                }
            } else {
                SendErrorToIpc(piper.Id, "readData", readErr)
                return
            }



			select {
			case <-doneChannel:
				return
			case <-sigc:
				return

			default:
				time.Sleep(50 * time.Millisecond)
			}
		}
	}

	// Pipe data
	go copy(remoteConn, piper.client, piper.doneChannel)
	go copy(piper.client, remoteConn, piper.doneChannel)
	<-piper.doneChannel
	SendToIpc(piper.Id, "closing", nil)
}

func (piper *DomainSocketPiper) Close() {
	if piper.debug {
		fmt.Printf("[id=%d] Done\n", piper.Id)
	}
	piper.doneChannel <- true

	if piper.client != nil {
		piper.client.Close()
		piper.client = nil
	}
}
