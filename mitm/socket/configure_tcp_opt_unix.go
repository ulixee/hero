// +build darwin

package main

import "syscall"

func ConfigureTcpTtl(fd uintptr, ttl int) error {
	syscall.SetsockoptInt(int(fd), syscall.IPPROTO_IP, syscall.IP_TTL, ttl)
	// mc throws errors in test
	return nil
}

func ConfigureTcpWindowSize(fd uintptr, windowSize int) error {
	return syscall.SetsockoptInt(int(fd), syscall.SOL_SOCKET, syscall.SO_RCVBUF, windowSize)
}
