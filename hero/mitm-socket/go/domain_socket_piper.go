package main

import (
	"errors"
	"fmt"
	"io"
	"net"
	"sync"
	"time"
)

type DomainSocketPiper struct {
	id       int
	client   net.Conn
	isClosed bool
	wg       sync.WaitGroup
	signals  *Signals
	debug    bool
}

func (piper *DomainSocketPiper) Pipe(remote net.Conn) {
	client := piper.client

	piper.wg.Add(2)
	clientHasDataChan := make(chan bool, 1)
	// Pipe data
	go piper.copy(client, remote, clientHasDataChan, true)
	go piper.copy(remote, client, clientHasDataChan, false)

	piper.wg.Wait()
	SendToIpc(piper.id, "closing", nil)
}

func (piper *DomainSocketPiper) copy(dst net.Conn, src net.Conn, clientHasData chan bool, isReadingFromRemote bool) {
	var totalBytes int64
	var n int
	var w int
	var neterr net.Error
	var ok bool
	var writeErr error
	var readErr error
	var direction string
	var waitForData bool

	if piper.debug {
		if isReadingFromRemote {
			direction = "from remote"
		} else {
			direction = "from client"
		}
	}

	data := make([]byte, 5*1096)

	defer piper.wg.Done()

	for {
		if isReadingFromRemote == true && waitForData {
			select {
			case <-clientHasData:
				waitForData = false
			case <-time.After(50 * time.Millisecond):
				if piper.signals.IsClosed || piper.isClosed {
					return
				}
			}
			if waitForData {
				continue
			}
		}
		src.SetReadDeadline(time.Now().Add(2 * time.Second)) // Set the deadline
		n, readErr = src.Read(data)

		if n > 0 {
			if isReadingFromRemote == false && len(clientHasData) == 0 {
				clientHasData <- true
			}
			w, writeErr = dst.Write(data[0:n])
			if w < 0 || n < w {
				w = 0
				if writeErr == nil {
					writeErr = errors.New("invalid write result")
				}
			}
			totalBytes += int64(w)

			if writeErr == nil && n != w {
				writeErr = io.ErrShortWrite
			}
			if writeErr != nil {
				SendErrorToIpc(piper.id, "writeErr", writeErr)
				piper.isClosed = true
				return
			}
		}

		if piper.debug {
			fmt.Printf("[id=%d] Read %d bytes %s. Total: %d\n", piper.id, n, direction, totalBytes)
		}

		if n == 0 && readErr == io.EOF {
			if isReadingFromRemote {
				if totalBytes == 0 {
					piper.isClosed = true
					return
				}

				SendToIpc(piper.id, "eof", nil)
				if len(clientHasData) > 0 {
					// drain
					<-clientHasData
				}
				waitForData = true
			} else {
				piper.isClosed = true
				return
			}
		}

		if readErr != nil && readErr != io.EOF {
			neterr, ok = readErr.(net.Error)
			// if not a timeout, stop and return
			if !ok || !neterr.Timeout() {
				SendErrorToIpc(piper.id, "readErr", readErr)
				piper.isClosed = true
				return
			}
		}

		if piper.signals.IsClosed || piper.isClosed {
			return
		}

		if n == 0 || readErr != nil {
			time.Sleep(50 * time.Millisecond)
		}
	}
}

func (piper *DomainSocketPiper) Close() {
	piper.isClosed = true
}
