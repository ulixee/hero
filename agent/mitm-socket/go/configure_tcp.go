// go build !windows
package main

import (
	"log"
	"syscall"
)

func ConfigureSocket(ttl int, windowSize int) func(network string, addr string, c syscall.RawConn) error {
	return func(network string, addr string, c syscall.RawConn) error {
		if ttl == 0 && windowSize == 0 {
			return nil
		}
		configErr := c.Control(func(fd uintptr) {
			if ttl > 0 {
				err := ConfigureTcpTtl(fd, ttl)
				if err != nil {
					log.Printf("Error setting IP_TTL. %#v", err)
				}
			}
			if windowSize > 0 {
				err := ConfigureTcpWindowSize(fd, windowSize)
				if err != nil {
					log.Printf("Error setting SO_RCVBUF. %#v", err)
				}
			}
		})
		if configErr != nil {
			return configErr
		}
		return nil
	}
}
